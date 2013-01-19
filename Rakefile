file 'dep.min.js' => 'dep.js' do
  sh 'uglifyjs -d module=0 dep.js > dep.min.js'
  puts "#{File.size('dep.min.js')} bytes"
end

desc "Build dep.min.js"
task :build => 'dep.min.js'

