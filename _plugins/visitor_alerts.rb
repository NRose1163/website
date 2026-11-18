# Site-specific hook; no fork or shadow copy of the al-folio theme is needed.
require 'cgi'
require 'uri'

Jekyll::Hooks.register [:pages, :documents], :post_render do |page|
  site = page.site
  config = site.config['visitor_alerts'] || {}
  next unless Jekyll.env == 'production' && config['enabled'] == true
  next unless page.output_ext == '.html' && page.data['visitor_alerts'] != false
  next if page.url == '/404.html' || page.output.include?('id="portfolio-visitor-alerts"')

  endpoint = config['endpoint'].to_s
  begin
    next unless URI.parse(endpoint).is_a?(URI::HTTPS) && URI.parse(endpoint).host
  rescue URI::InvalidURIError
    next
  end
  base = site.baseurl.to_s.sub(%r{/$}, '')
  attrs = {
    'id' => 'portfolio-visitor-alerts',
    'src' => "#{base}/assets/js/visitor-alerts.js",
    'data-endpoint' => endpoint,
    'data-site-url' => "#{site.config['url']}#{base}/",
    'data-consent-required' => (site.config['enable_cookie_consent'] == true).to_s
  }
  attributes = attrs.map { |key, value| %(#{key}="#{CGI.escapeHTML(value)}") }.join(' ')
  page.output = page.output.sub(%r{</body>}i, "<script defer #{attributes}></script>\n</body>")
end
