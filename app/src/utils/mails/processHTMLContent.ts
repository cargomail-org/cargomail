import { Rule, Media } from 'css'

const cssParse = require('css/lib/parse')

const processHTMLContent = (scope: any, raw: any) => {
  const parser = new DOMParser()
  const serializer = new XMLSerializer()
  const doc = parser.parseFromString(raw, 'text/html')
  // add target='_blank' to all links
  const links = Array.from(doc.getElementsByTagName('a'))
  links.forEach((link) => link.setAttribute('target', '_blank'))
  // add target='_blank' to all areas
  const areas = Array.from(doc.getElementsByTagName('area'))
  areas.forEach((link) => link.setAttribute('target', '_blank'))

  const stylesheets = Array.from(doc.getElementsByTagName('style'))
  const stripAndAddScope = (selectors: any) => {
    return selectors
      .filter((selector: any) => selector.toLowerCase !== 'body')
      .map((selector: any) => `#${scope} ${selector}`)
  }
  stylesheets.forEach((stylesheet) => {
    try {
      const css = cssParse.parse(stylesheet.innerText)
      Object.values(css?.stylesheet?.rules || {}).forEach((rule: any) => {
        if (rule.type === 'rule') {
          ;(rule as Rule).selectors = stripAndAddScope((rule as Rule).selectors) // eslint-disable-line
        } else if (rule.type === 'media') {
          ;(rule as Media).rules?.forEach((r) => {
            ;(r as Rule).selectors = stripAndAddScope((r as Rule).selectors) // eslint-disable-line
          })
        }
      })
      stylesheet.innerText = cssParse.stringify(css, { compress: true }) // eslint-disable-line
    } catch (e) {
      stylesheet.innerText = '' // eslint-disable-line
    }
  })

  return {
    content: serializer.serializeToString(doc),
  }
}

export default processHTMLContent
