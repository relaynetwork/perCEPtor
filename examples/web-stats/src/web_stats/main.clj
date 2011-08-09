(ns web-stats.main
  (:require
   [clj-etl-utils.log :as log]
   [noir.server :as server]
   ;; NB: cheat and use teporingo's redis lib for now...
   [teporingo.redis :as tr]
   [perceptor.provider :as perceptor])
  (:use
   noir.core
   hiccup.page-helpers
   hiccup.form-helpers
   [noir.response :only [json]]
   [teporingo.redis :only [*jedis*]]
   [perceptor.provider :only [*new-events* *provider*]]
   [clj-etl-utils.lang-utils :only [raise]]))

(def *config* (atom {:port 8080
                     :window-size-seconds 60
                     :key-expire-seconds  60}))

(defonce *server* (atom nil))

(defonce *esp* (atom nil))

(defn restart-server []
  (if @*server*
    (do
      (server/stop @*server*)
      (reset! *server* nil)))
  (reset! *server* (server/start (get @*config* :port))))

(defn layout [title & body]
  (html5
   [:head
    (include-js "/js/jquery-1.5.1.min.js")
    (include-js "/js/app.js")
    (include-css "/css/app.css")
    (include-js "/js/raphael-min.js")
    (include-js "/js/g.raphael-min.js")
    (include-js "/js/g.bar-min.js")
    (include-js "/js/g.line-min.js")
    [:title title]]
   body))

(defpage "/" {}
  (layout
      "perCEPtor Example: Stats"
    [:pre#stat-info
     "..stats go here.."]
    [:form {:id "event" :method "POST" :action "/eventnew"}
     (text-field :event-type "GenericEvent")
     (text-field :stock "xyz")
     (text-field :price "1.99")
     (text-field :emitter-interval "250")
     [:br]
     [:button#post-event "Post Event"]
     [:button#post-rand "Gen Rand Price"]
     [:button#start-emitter "Start Emitter"]
     [:button#stop-emitter "Stop Emitter"]]
    [:div#graph]
    [:div#footer
     [:p
      [:a {:href "/"} "Home"]]]))

(defpage [:post "/event/new"] {:keys [event-type stock price]}
  (log/infof "post event: %s [%s %s]" event-type stock price)
  (binding [*provider* @*esp*]
    (perceptor/emit-event "StockEvent"
                          "stock" stock
                          "price" (Double/parseDouble price)))
  (json [{:result "ok"}]))


(defpage "/js/*" params
  (let [f (get params :*)
        f (java.io.File. f)]
    (when (.exists f)
      (slurp f))))

(defpage "/css/*" params
  (let [f (get params :*)
        f (java.io.File. f)]
    (when (.exists f)
      (slurp f))))

;; read all stats from REDIS
(defpage "/stats" {}
  (tr/with-jedis :local
    (json [{:result
            (map
             (fn [k]
               [k (.get *jedis* k)])
             (sort (.keys *jedis* "stats.*")))}])))

(defpage "/stock/:name" {name :name}
  (binding [*provider* @*esp*]
    (json [{:result
            (take 50
                  (concat (for [e (perceptor/immediate-query (format "select * from StockEventsLast50 where stock = '%s'" name))]
                     (.getProperties e))
                          (repeatedly (fn [] {"stock" name "price" 0}))))}])))



(defn service-main []
  (log/infof "Starting services")
  (log/load-log4j-file "dev-resources/log4j.properties")
  (tr/register-redis-pool :local {:host "localhost"
                                  :port 6379})

  (if-not (nil? @*esp*)
    (binding [*provider* @*esp*]
      (perceptor/stop-all-statements)))

  (perceptor/register-provider
   :stocks
   (fn [mgr]
     (perceptor/declare-type "StockEvent"
                             "stock" "string"
                             "price" "float")
     (perceptor/compile-statement (format "CREATE WINDOW StockEventsLastMinute.win:time(%s seconds) AS StockEvent" (:window-size-seconds @*config*)))
     (perceptor/compile-statement (format "CREATE WINDOW StockEventsLast50.win:length(50) AS StockEvent"))
     (perceptor/compile-statement "insert into StockEventsLastMinute select * from StockEvent")
     (perceptor/compile-statement "insert into StockEventsLast50 select * from StockEvent")))


  (reset! *esp* (perceptor/make-provider :stocks))

  (perceptor/register-listener
   :trade-count-listener
   (format "select count(*) as count, stock from StockEvent.win:time(%s seconds) group by stock" (:window-size-seconds @*config*))
   (fn []
     (log/infof "count event: %s" (vec (map bean *new-events*)))
     (tr/with-jedis :local
       (doseq [e *new-events*]
         (let [props (.getProperties e)
               key   (format "stats.%s.trades.60s" (get props "stock"))
               count (str (get props "count"))]
           (log/infof " set [count]: %s/%s=%s/%s"
                      key (class key)
                      count (class count))
           (.set *jedis* key count)
           (.expire *jedis* key (:key-expire-seconds @*config*)))))))

  (perceptor/register-listener
   :trade-avg-listener
   (format "select avg(price) as price, stock from StockEvent.win:time(%s seconds) group by stock" (:window-size-seconds @*config*))
   (fn []
     (log/infof "avg event: %s" (vec (map bean *new-events*)))
     (tr/with-jedis :local
       (doseq [e *new-events*]
         (let [props (.getProperties e)
               key   (format "stats.%s.avg.60s" (get props "stock"))
               price (str (get props "price"))]
           (log/infof " set [avg]: %s/%s=%s/%s"
                      key (class key)
                      price (class price))
           (.set *jedis* key price)
           (.expire *jedis* key (:key-expire-seconds @*config*)))))))


  (perceptor/register-listener
   :trade-min-listener
   (format "select min(price) as price, stock from StockEvent.win:time(%s seconds) group by stock" (:window-size-seconds @*config*))
   (fn []
     (log/infof "min event: %s" (vec (map bean *new-events*)))
     (tr/with-jedis :local
       (doseq [e *new-events*]
         (let [props (.getProperties e)
               key   (format "stats.%s.min.60s" (get props "stock"))
               price (str (get props "price"))]
           (log/infof " set [min]: %s/%s=%s/%s"
                      key (class key)
                      price (class price))
           (.set *jedis* key price)
           (.expire *jedis* key (:key-expire-seconds @*config*)))))))


  (perceptor/register-listener
   :trade-max-listener
   (format "select max(price) as price, stock from StockEvent.win:time(%s seconds) group by stock" (:window-size-seconds @*config*))
   (fn []
     (log/infof "max event: %s" (vec (map bean *new-events*)))
     (tr/with-jedis :local
       (doseq [e *new-events*]
         (let [props (.getProperties e)
               key   (format "stats.%s.max.60s" (get props "stock"))
               price (str (get props "price"))]
           (log/infof " set [max]: %s/%s=%s/%s"
                      key (class key)
                      price (class price))
           (.set *jedis* key price)
           (.expire *jedis* key (:key-expire-seconds @*config*)))))))

  (binding [*provider* @*esp*]
    (perceptor/start-listener :trade-count-listener)
    (perceptor/start-listener :trade-avg-listener)
    (perceptor/start-listener :trade-max-listener)
    (perceptor/start-listener :trade-min-listener))

  ;; pre-populate with 1 example
  (binding [*provider* @*esp*]
    (perceptor/emit-event "StockEvent"
                          "stock" "xyz"
                          "price" (Double/parseDouble "1.99")))

  ;; register the query / listener
  (restart-server))

(defn -main [& args]
  (service-main))


(comment
  (binding [*provider* @*esp*]
    (perceptor/emit-event "StockEvent"
                          "stock" "xyz"
                          "price" (Double/parseDouble "1.99")))

  (binding [*provider* @*esp*]
    (for [e (perceptor/immediate-query "select * from StockEventsLastMinute")]
      (bean e)))

  (binding [*provider* @*esp*]
    (count (for [e (perceptor/immediate-query "select * from StockEventsLastMinute limit 10")]
       (.getProperties e))))

  (tr/with-jedis :local
    (.del *jedis* (into-array String (vec (.keys *jedis* "*")))))

  (tr/with-jedis :local
    (.expire *jedis* "stats.i.avg.60s" 10))

  (service-main)


  )