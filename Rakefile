require 'yaml'
require 'erb'
require 'ostruct'
require 'pp'
require 'fileutils'
$project_root = File.dirname(__FILE__)
$redis_config = YAML.load_file(File.join($project_root,'config','redis.yml'))["redis"]

#pp $redis_config

def redis_url
  $redis_config["download_url"]
end

def redis_archive
  redis_url.split('/')[-1]
end

def redis_dir
  File.basename(redis_archive,".tar.gz")
end

def redis_ver
  redis_dir.split('-')[-1]
end

def redis_erb_template
  "#{$project_root}/templates/redis.conf.erb"
end

def redis_config_file role
  "#{$project_root}/redis/redis-#{role.to_s}.conf"
end

def gen_redis_config role, bindings
  File.open(redis_config_file(role),"w") do |f|
    template = File.read(redis_erb_template)
    bindings = OpenStruct.new bindings
    result = ERB.new(template).result(bindings.send(:binding))
    f.puts result
  end
end

namespace :perceptor do
  namespace :redis do
    desc "Download, build and Install Redis"
    task :install do
      Dir.chdir "redis/" do |p|
        unless File.exist? redis_archive
          system "wget", redis_url
        end

        unless File.exist? redis_dir
          system "tar", "xzvf", redis_archive
        end

        Dir.chdir redis_dir do |p|
          unless File.exist? "src/redis-server"
            system "make"
          end
        end
      end
    end

    namespace :master do
      desc "generate redis config"
      task :gen_config => [:install] do 
        gen_redis_config :master, 
          :port => 6379,
          :role => :master,
          :pidfile => "master.pid",
          :dbfilename => "master-dump.rdb",
          :dir => "./",
          :appendfilename => "master-appendonly.aof",
          :vm_swap_file => "master-redis.swap"
      end

      desc "Run master redis"
      task :run => [:install,:gen_config] do
        cmd = ["#{$project_root}/redis/#{redis_dir}/src/redis-server", redis_config_file(:master)]
        pp cmd
        system *cmd
      end
    end

    namespace :slave do
      desc "generate redis config"
      task :gen_config => [:install] do 
        gen_redis_config :slave, 
          :port => 6380,
          :slave => true,
          :master_port => 6379,
          :role => :slave,
          :pidfile => "slave.pid",
          :dbfilename => "slave-dump.rdb",
          :dir => "./",
          :appendfilename => "slave-appendonly.aof",
          :vm_swap_file => "slave-redis.swap"
      end

      desc "Run slave redis"
      task :run => [:install,:gen_config] do
        cmd = ["#{$project_root}/redis/#{redis_dir}/src/redis-server", redis_config_file(:slave)]
        #pp cmd
        system *cmd
      end
    end
  end

end

namespace :perceptor do
  namespace :exmaples do
    desc "make checkouts"
    task :make_checkouts do
      Dir.chdir "examples/web-stats" do |p|
        FileUtils.mkdir_p "checkouts"
        FileUtils.ln_s $project_root, "checkouts"
      end
    end
    desc "Run Example"
    task :run do
      Dir.chdir "examples/web-stats" do |p|
        unless system "lein", "run"
          raise "Error running example via 'lein run'"
        end
      end
    end
    desc "Swank: start a swank server."
    task :swank do
      Dir.chdir "examples/web-stats" do |p|
        unless system "lein", "swank"
          raise "Error running: 'lein swank'"
        end
      end
    end
  end
end
