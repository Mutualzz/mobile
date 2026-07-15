require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'VoiceLiveActivity'
  s.version        = package['version']
  s.summary        = 'Native Voice Live Activity controller'
  s.description    = 'Start, update, and end Mutualzz voice Live Activities'
  s.license        = 'MIT'
  s.author         = 'Mutualzz'
  s.homepage       = 'https://mutualzz.com'
  s.platforms      = { :ios => '17.0' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
