(defproject com.github.kyleburton/perceptor "1.0.0-SNAPSHOT"
  :description "Clojure bindings for Esper: http://esper.codehaus.org/"
  :dev-dependencies [[swank-clojure "1.4.0-SNAPSHOT"]]
  :local-repo-classpath true
  :dependencies [[org.clojure/clojure                         "1.3.0"]
                 [com.espertech/esper                         "4.7.0"]
                 [org.clojars.kyleburton/clj-etl-utils        "1.3.7"]
                 [com.relaynetwork/clorine                    "1.0.6"]])
