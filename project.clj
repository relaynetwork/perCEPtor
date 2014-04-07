(defproject com.github.kyleburton/perceptor "1.0.0-SNAPSHOT"
  :description "Clojure bindings for Esper: http://esper.codehaus.org/"
  :dev-dependencies [[swank-clojure "1.4.0-SNAPSHOT"]]
  :local-repo-classpath true
  :dependencies [[org.clojure/clojure                         "1.5.1"]
                 [com.espertech/esper                         "4.11.0"]
                 [com.github.kyleburton/clj-etl-utils         "1.0.79"]
                 [com.relaynetwork/clorine                    "1.0.17"]])
