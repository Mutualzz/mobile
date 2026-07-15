require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'MutualzzVoiceLiveActivity'
  s.version        = package['version']
  s.summary        = 'Native Mutualzz voice Live Activity controller'
  s.description    = 'Start, update, and end Mutualzz voice Live Activities from React Native'
  s.license        = 'MIT'
  s.author         = 'Mutualzz'
  s.homepage       = 'https://mutualzz.com'
  s.platforms      = { :ios => '17.0' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
  s.source_files = '**/*.{h,m,mm,swift}'
end
