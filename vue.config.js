// const fs = require('fs')
// const packageJson = fs.readFileSync('./package.json')
// const version = JSON.parse(packageJson).version || 0

process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  pluginOptions: {
    quasar: {
      importStrategy: 'kebab',
      // all: 'autos',
      // autoImportComponentCase: 'kebabs',
      rtlSupport: false
      // framework: {
      //   // Possible values for "importStrategy":
      //   // * 'auto' - Auto-import needed Quasar components & directives
      //   // * 'all'  - Import everything from Quasar
      //   //            (not treeshaking Quasar; biggest bundle size)
      //   importStrategy: 'auto'
      // }
    },
    webpackBundleAnalyzer: {
      openAnalyzer: true
    }
  },
  transpileDependencies: [
    'quasar'
  ],
  pwa: {
    name: 'Вопросики',
    shortName: 'Вопросики',
    themeColor: '#b2f08b',
    lang: 'ru',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    manifestOptions: {
      name: 'Вопросики',
      short_name: 'Вопросики',
      description: 'Для удобного доступа и отыгрыша пакетов спортивного Что? Где? Когда?',
      lang: 'ru',
      theme_color: '#b2f08b',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      orientation: 'any'
    }
  }
}
