(defproject web-stats "1.0.0-SNAPSHOT"
  :description "FIXME: write description"
  :dev-dependencies [[swank-clojure "1.4.0-SNAPSHOT"]]
  :local-repo-classpath true
  :dev-resources-path "dev-resources"
  :main web-stats.main
  :dependencies [[org.clojure/clojure             "1.5.1"]
                 [com.github.kyleburton/perceptor "1.0.0-SNAPSHOT"]
                 [com.github.kyleburton/teporingo "2.1.27"]
                 [org.clojure/data.json           "0.2.2"] ;; etl utils needs 0.2.2 if we're on clojure 1.2
                 [hiccup                          "1.0.5"]
                 [noir                            "1.3.0"]])
