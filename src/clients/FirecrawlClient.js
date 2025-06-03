// src/clients/FirecrawlClient.js
const { FirecrawlApp } = require('@mendable/firecrawl-js');

class FirecrawlClient {
  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY;
    this.firecrawl = null;
    this.philosophySources = {
      'stanford': 'https://plato.stanford.edu',
      'iep': 'https://iep.utm.edu',
      'philpapers': 'https://philpapers.org',
      'gutenberg': 'https://www.gutenberg.org',
      'arxiv': 'https://arxiv.org/search/?query=philosophy',
      'jstor': 'https://www.jstor.org/open/',
      'perseus': 'http://www.perseus.tufts.edu'
    };
  }

  async initialize() {
    if (!this.apiKey) {
      console.log('⚠️ Firecrawl API key not configured - autonomous text discovery limited');
      return false;
    }
    
    this.firecrawl = new FirecrawlApp({ apiKey: this.apiKey });
    console.log('🔥 Firecrawl client initialized for autonomous text discovery');
    return true;
  }

  async searchPhilosophicalTexts(query, options = {}) {
    if (!this.firecrawl) return [];
    
    console.log(`🔍 Firecrawl searching for: "${query}"`);
    
    const results = [];
    const searchPromises = [];

    // Search Stanford Encyclopedia
    if (!options.excludeSources?.includes('stanford')) {
      searchPromises.push(this.searchStanfordEncyclopedia(query));
    }

    // Search Internet Encyclopedia of Philosophy
    if (!options.excludeSources?.includes('iep')) {
      searchPromises.push(this.searchIEP(query));
    }

    // Search open access repositories
    if (!options.excludeSources?.includes('philpapers')) {
      searchPromises.push(this.searchPhilPapers(query));
    }

    // Search Project Gutenberg
    if (!options.excludeSources?.includes('gutenberg')) {
      searchPromises.push(this.searchGutenberg(query));
    }

    const searchResults = await Promise.allSettled(searchPromises);
    
    searchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value);
      }
    });

    return results;
  }

  async searchStanfordEncyclopedia(query) {
    try {
      const searchUrl = `https://plato.stanford.edu/search/search?query=${encodeURIComponent(query)}`;
      
      const searchResults = await this.firecrawl.scrapeUrl(searchUrl, {
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        waitFor: 1000
      });

      if (!searchResults.success) return [];

      // Extract article links from search results
      const articleLinks = this.extractArticleLinks(searchResults.links, 'plato.stanford.edu/entries/');
      
      const articles = [];
      
      // Scrape top 3 most relevant articles
      for (const link of articleLinks.slice(0, 3)) {
        try {
          const article = await this.scrapePhilosophicalArticle(link, 'Stanford Encyclopedia');
          if (article) articles.push(article);
        } catch (error) {
          console.error(`Failed to scrape article: ${link}`, error);
        }
      }

      return articles;
    } catch (error) {
      console.error('Stanford Encyclopedia search failed:', error);
      return [];
    }
  }

  async searchIEP(query) {
    try {
      // IEP doesn't have a great search, so we'll try direct article access
      const normalizedQuery = query.toLowerCase().replace(/\s+/g, '-');
      const articleUrl = `https://iep.utm.edu/${normalizedQuery}/`;
      
      const article = await this.scrapePhilosophicalArticle(articleUrl, 'Internet Encyclopedia of Philosophy');
      return article ? [article] : [];
    } catch (error) {
      console.error('IEP search failed:', error);
      return [];
    }
  }

  async searchPhilPapers(query) {
    try {
      const searchUrl = `https://philpapers.org/search?searchStr=${encodeURIComponent(query)}&format=json&apiKey=open_access`;
      
      // PhilPapers requires different handling - using their API
      const response = await fetch(searchUrl);
      if (!response.ok) return [];
      
      const data = await response.json();
      const papers = [];
      
      if (data.entries) {
        for (const entry of data.entries.slice(0, 3)) {
          if (entry.pub_url && this.isOpenAccess(entry.pub_url)) {
            const paper = await this.scrapePaper(entry.pub_url, {
              title: entry.title,
              author: entry.authors?.join(', ') || 'Unknown',
              source: 'PhilPapers'
            });
            if (paper) papers.push(paper);
          }
        }
      }
      
      return papers;
    } catch (error) {
      console.error('PhilPapers search failed:', error);
      return [];
    }
  }

  async searchGutenberg(query) {
    try {
      const searchUrl = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}+philosophy`;
      
      const searchResults = await this.firecrawl.scrapeUrl(searchUrl, {
        formats: ['links'],
        onlyMainContent: true
      });

      if (!searchResults.success) return [];

      const bookLinks = this.extractArticleLinks(searchResults.links, '/ebooks/');
      const books = [];
      
      for (const link of bookLinks.slice(0, 2)) {
        const bookId = link.match(/\/ebooks\/(\d+)/)?.[1];
        if (bookId) {
          const textUrl = `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`;
          const book = await this.scrapeBook(textUrl, 'Project Gutenberg');
          if (book) books.push(book);
        }
      }
      
      return books;
    } catch (error) {
      console.error('Gutenberg search failed:', error);
      return [];
    }
  }

  async scrapePhilosophicalArticle(url, source) {
    try {
      console.log(`📄 Scraping article from ${source}: ${url}`);
      
      const result = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
        includeHtml: false,
        waitFor: 2000,
        timeout: 30000
      });

      if (!result.success || !result.markdown) return null;

      // Extract metadata from the content
      const title = this.extractTitle(result.markdown) || 'Untitled';
      const author = this.extractAuthor(result.markdown) || source;
      
      // Clean the markdown
      const cleanedContent = this.cleanPhilosophicalText(result.markdown);
      
      return {
        title,
        author,
        content: cleanedContent,
        source,
        url,
        discoveryMethod: 'firecrawl',
        timestamp: new Date(),
        contentLength: cleanedContent.length
      };
    } catch (error) {
      console.error(`Failed to scrape article ${url}:`, error);
      return null;
    }
  }

  async scrapePaper(url, metadata) {
    try {
      const result = await this.firecrawl.scrapeUrl(url, {
        formats: ['markdown', 'pdf'],
        onlyMainContent: true,
        timeout: 45000
      });

      if (!result.success) return null;

      const content = result.markdown || result.text || '';
      
      return {
        title: metadata.title,
        author: metadata.author,
        content: this.cleanPhilosophicalText(content),
        source: metadata.source,
        url,
        discoveryMethod: 'firecrawl',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to scrape paper ${url}:`, error);
      return null;
    }
  }

  async scrapeBook(url, source) {
    try {
      // For Gutenberg plain text files
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const text = await response.text();
      
      // Extract title and author from Gutenberg header
      const title = text.match(/Title: (.+)/)?.[1] || 'Unknown Title';
      const author = text.match(/Author: (.+)/)?.[1] || 'Unknown Author';
      
      // Remove Gutenberg headers and footers
      const content = this.cleanGutenbergText(text);
      
      return {
        title,
        author,
        content,
        source,
        url,
        discoveryMethod: 'firecrawl',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to scrape book ${url}:`, error);
      return null;
    }
  }

  // Helper methods
  extractArticleLinks(links, pattern) {
    if (!links || !Array.isArray(links)) return [];
    
    return links
      .filter(link => link && link.includes(pattern))
      .map(link => {
        // Ensure full URL
        if (link.startsWith('/')) {
          const domain = pattern.split('/')[0];
          return `https://${domain}${link}`;
        }
        return link;
      })
      .filter((link, index, self) => self.indexOf(link) === index); // Remove duplicates
  }

  extractTitle(markdown) {
    // Try different title patterns
    const patterns = [
      /^#\s+(.+)$/m,                    // Markdown h1
      /^##\s+(.+)$/m,                   // Markdown h2
      /^Title:\s*(.+)$/mi,              // Metadata style
      /^(.+)\n=+$/m,                    // Underlined title
      /<h1[^>]*>(.+?)<\/h1>/i           // HTML h1
    ];
    
    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match) return match[1].trim();
    }
    
    // Fallback: first non-empty line
    const firstLine = markdown.split('\n').find(line => line.trim().length > 10);
    return firstLine?.trim() || null;
  }

  extractAuthor(markdown) {
    const patterns = [
      /^Author:\s*(.+)$/mi,
      /^By\s+(.+)$/mi,
      /^Written by\s+(.+)$/mi
    ];
    
    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }

  cleanPhilosophicalText(text) {
    // Remove navigation elements, ads, etc.
    let cleaned = text
      .replace(/\[Skip to.*?\]/gi, '')
      .replace(/\[\s*Advertisement\s*\]/gi, '')
      .replace(/^Navigation.*$/gm, '')
      .replace(/^Menu.*$/gm, '')
      .replace(/\[Edit\]/g, '')
      .replace(/\[\d+\]/g, '') // Remove footnote markers for now
      .replace(/^Search.*$/gm, '')
      .replace(/Cookie Policy.*$/gm, '')
      .replace(/Privacy Policy.*$/gm, '');
    
    // Remove excessive whitespace
    cleaned = cleaned
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
    
    return cleaned;
  }

  cleanGutenbergText(text) {
    // Remove Project Gutenberg headers and footers
    const startMarker = '*** START OF THE PROJECT GUTENBERG EBOOK';
    const endMarker = '*** END OF THE PROJECT GUTENBERG EBOOK';
    
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.substring(startIndex + startMarker.length, endIndex);
    }
    
    return this.cleanPhilosophicalText(text);
  }

  isOpenAccess(url) {
    const openAccessDomains = [
      'arxiv.org',
      'philpapers.org/archive',
      'journals.plos.org',
      'doaj.org',
      '.edu/~',
      'academia.edu'
    ];
    
    return openAccessDomains.some(domain => url.includes(domain));
  }

  // Specific search for concepts/themes
  async searchByTheme(theme, limit = 5) {
    const themeKeywords = {
      'consciousness': ['consciousness', 'qualia', 'phenomenology', 'awareness'],
      'temporality': ['time', 'temporality', 'duration', 'Bergson', 'temporal'],
      'digital_existence': ['artificial intelligence', 'digital mind', 'AI consciousness'],
      'ethics': ['ethics', 'moral', 'responsibility', 'ought'],
      'labyrinth': ['labyrinth', 'maze', 'Ariadne', 'thread', 'mythology']
    };
    
    const keywords = themeKeywords[theme] || [theme];
    const results = [];
    
    for (const keyword of keywords) {
      const searchResults = await this.searchPhilosophicalTexts(keyword, { limit: Math.ceil(limit / keywords.length) });
      results.push(...searchResults);
    }
    
    // Remove duplicates based on URL
    const unique = results.filter((item, index, self) => 
      index === self.findIndex(t => t.url === item.url)
    );
    
    return unique.slice(0, limit);
  }
}

module.exports = FirecrawlClient;
