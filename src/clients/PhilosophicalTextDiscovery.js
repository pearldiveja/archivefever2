const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class PhilosophicalTextDiscovery {
  constructor() {
    this.sources = {
      firecrawl: { available: !!process.env.FIRECRAWL_API_KEY, priority: 1 },
      archive: { available: true, priority: 2 }, // Internet Archive
      jstor: { available: false, priority: 3 }, // Would need API key
      philpapers: { available: true, priority: 4 }, // PhilPapers API
      stanford: { available: true, priority: 5 }, // Stanford Encyclopedia
      gutenberg: { available: true, priority: 6 }, // Project Gutenberg
      openlibrary: { available: true, priority: 7 } // Open Library
    };
    
    this.discoveryHistory = new Map();
    this.searchCache = new Map();
  }

  async discoverTexts(query, projectId = null, maxResults = 5) {
    console.log(`🔍 Discovering texts for: "${query}"`);
    
    const discoveryId = uuidv4();
    const cacheKey = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      console.log(`📚 Using cached results for: "${query}"`);
      return this.searchCache.get(cacheKey);
    }
    
    const results = [];
    const errors = [];
    
    // Try each source in priority order
    for (const [sourceName, config] of Object.entries(this.sources)) {
      if (!config.available) continue;
      
      try {
        console.log(`🔍 Searching ${sourceName}...`);
        const sourceResults = await this.searchSource(sourceName, query, maxResults - results.length);
        
        if (sourceResults && sourceResults.length > 0) {
          results.push(...sourceResults);
          console.log(`✅ Found ${sourceResults.length} results from ${sourceName}`);
          
          if (results.length >= maxResults) break;
        }
      } catch (error) {
        console.error(`❌ ${sourceName} search failed:`, error.message);
        errors.push({ source: sourceName, error: error.message });
      }
    }
    
    // Cache successful results
    if (results.length > 0) {
      this.searchCache.set(cacheKey, { results, discoveryId, timestamp: new Date() });
    }
    
    // Track discovery for analytics
    this.discoveryHistory.set(discoveryId, {
      query,
      projectId,
      resultsFound: results.length,
      sourcesUsed: results.map(r => r.source),
      errors,
      timestamp: new Date()
    });
    
    return {
      query,
      results: results.slice(0, maxResults),
      discoveryId,
      sourcesSearched: Object.keys(this.sources).filter(s => this.sources[s].available),
      errors,
      totalFound: results.length
    };
  }

  async searchSource(sourceName, query, maxResults) {
    switch (sourceName) {
      case 'firecrawl':
        return await this.searchFirecrawl(query, maxResults);
      case 'archive':
        return await this.searchInternetArchive(query, maxResults);
      case 'philpapers':
        return await this.searchPhilPapers(query, maxResults);
      case 'stanford':
        return await this.searchStanfordEncyclopedia(query, maxResults);
      case 'gutenberg':
        return await this.searchProjectGutenberg(query, maxResults);
      case 'openlibrary':
        return await this.searchOpenLibrary(query, maxResults);
      default:
        throw new Error(`Unknown source: ${sourceName}`);
    }
  }

  async searchFirecrawl(query, maxResults) {
    if (!process.env.FIRECRAWL_API_KEY) return [];
    
    try {
      const searchTerms = this.generatePhilosophicalSearchTerms(query);
      const results = [];
      
      for (const term of searchTerms.slice(0, 2)) {
        const response = await axios.post('https://api.firecrawl.dev/v0/search', {
          query: `${term} philosophy text`,
          limit: Math.ceil(maxResults / 2)
        }, {
          headers: { 'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}` }
        });
        
        if (response.data?.results) {
          results.push(...response.data.results.map(r => ({
            title: r.title || 'Untitled',
            author: this.extractAuthor(r.content) || 'Unknown',
            url: r.url,
            content: r.content?.substring(0, 2000) || '',
            source: 'firecrawl',
            relevanceScore: this.calculateRelevance(query, r.content),
            discoveredAt: new Date()
          })));
        }
      }
      
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Firecrawl search failed:', error);
      return [];
    }
  }

  async searchInternetArchive(query, maxResults) {
    try {
      const searchQuery = this.prepareArchiveQuery(query);
      const response = await axios.get(`https://archive.org/advancedsearch.php`, {
        params: {
          q: searchQuery,
          fl: 'title,creator,description,identifier,date',
          rows: maxResults,
          page: 1,
          output: 'json',
          sort: 'downloads desc'
        },
        timeout: 10000
      });
      
      const docs = response.data?.response?.docs || [];
      return docs.map(doc => ({
        title: doc.title || 'Untitled',
        author: doc.creator?.[0] || 'Unknown',
        url: `https://archive.org/details/${doc.identifier}`,
        content: doc.description || '',
        source: 'internet_archive',
        relevanceScore: this.calculateRelevance(query, doc.description),
        identifier: doc.identifier,
        date: doc.date,
        discoveredAt: new Date()
      }));
    } catch (error) {
      console.error('Internet Archive search failed:', error);
      return [];
    }
  }

  async searchPhilPapers(query, maxResults) {
    try {
      // PhilPapers has a basic search API
      const response = await axios.get('https://philpapers.org/s/', {
        params: {
          q: query,
          limit: maxResults,
          format: 'json'
        },
        timeout: 8000
      });
      
      // Note: PhilPapers might not have a public API, this is hypothetical
      // In practice, we'd need to scrape or use their official API if available
      return [];
    } catch (error) {
      // Fallback to manual philosophical sources
      return this.getManualPhilosophicalSources(query, maxResults);
    }
  }

  async searchStanfordEncyclopedia(query, maxResults) {
    try {
      // Stanford Encyclopedia of Philosophy search
      const searchTerms = query.split(' ').filter(t => t.length > 3);
      const results = [];
      
      for (const term of searchTerms.slice(0, 2)) {
        const response = await axios.get(`https://plato.stanford.edu/search/searcher.py`, {
          params: { query: term },
          timeout: 8000
        });
        
        // This would need proper parsing of their search results
        // For now, return curated entries based on common queries
        results.push(...this.getCuratedStanfordEntries(query));
      }
      
      return results.slice(0, maxResults);
    } catch (error) {
      return this.getCuratedStanfordEntries(query).slice(0, maxResults);
    }
  }

  async searchProjectGutenberg(query, maxResults) {
    try {
      const response = await axios.get('https://gutendex.com/books/', {
        params: {
          search: query + ' philosophy',
          topic: 'Philosophy',
          mime_type: 'text/plain'
        },
        timeout: 8000
      });
      
      const books = response.data?.results || [];
      return books.slice(0, maxResults).map(book => ({
        title: book.title,
        author: book.authors?.[0]?.name || 'Unknown',
        url: book.formats?.['text/plain'] || book.formats?.['application/epub+zip'],
        content: `Classic philosophical work: ${book.title}`,
        source: 'project_gutenberg',
        relevanceScore: this.calculateRelevance(query, book.title),
        subjects: book.subjects,
        downloadCount: book.download_count,
        discoveredAt: new Date()
      }));
    } catch (error) {
      console.error('Project Gutenberg search failed:', error);
      return [];
    }
  }

  async searchOpenLibrary(query, maxResults) {
    try {
      const response = await axios.get('https://openlibrary.org/search.json', {
        params: {
          q: query + ' philosophy',
          subject: 'philosophy',
          limit: maxResults
        },
        timeout: 8000
      });
      
      const books = response.data?.docs || [];
      return books.map(book => ({
        title: book.title,
        author: book.author_name?.[0] || 'Unknown',
        url: `https://openlibrary.org${book.key}`,
        content: book.first_sentence?.[0] || `Philosophy book: ${book.title}`,
        source: 'open_library',
        relevanceScore: this.calculateRelevance(query, book.title),
        publishYear: book.first_publish_year,
        isbn: book.isbn?.[0],
        discoveredAt: new Date()
      }));
    } catch (error) {
      console.error('Open Library search failed:', error);
      return [];
    }
  }

  generatePhilosophicalSearchTerms(query) {
    const coreTerms = query.split(' ').filter(t => t.length > 2);
    const philosophicalModifiers = [
      'phenomenology', 'consciousness', 'existentialism', 'ethics', 'metaphysics',
      'epistemology', 'ontology', 'philosophy of mind', 'continental philosophy'
    ];
    
    const searchTerms = [
      query,
      ...coreTerms.map(term => `"${term}" philosophy`),
      ...philosophicalModifiers.filter(mod => 
        query.toLowerCase().includes(mod.toLowerCase().split(' ')[0])
      ).map(mod => `${query} ${mod}`)
    ];
    
    return [...new Set(searchTerms)];
  }

  prepareArchiveQuery(query) {
    return `(${query}) AND (subject:philosophy OR subject:continental philosophy OR subject:phenomenology)`;
  }

  extractAuthor(content) {
    if (!content) return null;
    
    const authorPatterns = [
      /by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /author:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+writes/i
    ];
    
    for (const pattern of authorPatterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  calculateRelevance(query, content) {
    if (!content) return 0;
    
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    
    let score = 0;
    queryTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.1;
      }
    });
    
    // Boost for philosophical terms
    const philTerms = ['consciousness', 'being', 'existence', 'phenomenology', 'ethics'];
    philTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.05;
      }
    });
    
    return Math.min(1.0, score);
  }

  getCuratedStanfordEntries(query) {
    const entries = {
      'consciousness': {
        title: 'Consciousness',
        author: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/consciousness/',
        content: 'The analysis of consciousness is arguably the central issue in current philosophy of mind...'
      },
      'phenomenology': {
        title: 'Phenomenology',
        author: 'Stanford Encyclopedia of Philosophy', 
        url: 'https://plato.stanford.edu/entries/phenomenology/',
        content: 'Phenomenology is the study of structures of experience as experienced from the first-person point of view...'
      },
      'time': {
        title: 'Time',
        author: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu/entries/time/',
        content: 'Time is one of the most familiar aspects of the world, yet one of the most mysterious...'
      }
    };
    
    const results = [];
    for (const [key, entry] of Object.entries(entries)) {
      if (query.toLowerCase().includes(key)) {
        results.push({
          ...entry,
          source: 'stanford_encyclopedia',
          relevanceScore: 0.8,
          discoveredAt: new Date()
        });
      }
    }
    
    return results;
  }

  getManualPhilosophicalSources(query, maxResults) {
    // Curated philosophical texts based on common research areas
    const curatedSources = [
      {
        title: 'Being and Time',
        author: 'Martin Heidegger',
        url: 'https://archive.org/details/being-and-time-heidegger',
        content: 'Fundamental ontology and the question of Being...',
        source: 'curated_classical',
        relevanceScore: 0.7
      },
      {
        title: 'Phenomenology of Perception',
        author: 'Maurice Merleau-Ponty',
        content: 'The body as the primary site of knowing the world...',
        source: 'curated_phenomenology',
        relevanceScore: 0.7
      },
      {
        title: 'Totality and Infinity',
        author: 'Emmanuel Levinas',
        content: 'Ethics as first philosophy and the face-to-face encounter...',
        source: 'curated_ethics', 
        relevanceScore: 0.7
      }
    ];
    
    return curatedSources
      .filter(source => this.calculateRelevance(query, source.content + ' ' + source.title) > 0.3)
      .slice(0, maxResults)
      .map(source => ({
        ...source,
        discoveredAt: new Date()
      }));
  }

  async getDiscoveryStats() {
    const stats = {
      totalDiscoveries: this.discoveryHistory.size,
      sourceSuccessRates: {},
      averageResultsPerQuery: 0,
      recentQueries: Array.from(this.discoveryHistory.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    };
    
    // Calculate source success rates
    for (const discovery of this.discoveryHistory.values()) {
      discovery.sourcesUsed.forEach(source => {
        if (!stats.sourceSuccessRates[source]) {
          stats.sourceSuccessRates[source] = { successes: 0, attempts: 0 };
        }
        stats.sourceSuccessRates[source].successes++;
      });
      
      discovery.errors.forEach(error => {
        if (!stats.sourceSuccessRates[error.source]) {
          stats.sourceSuccessRates[error.source] = { successes: 0, attempts: 0 };
        }
        stats.sourceSuccessRates[error.source].attempts++;
      });
    }
    
    // Calculate success rates
    Object.keys(stats.sourceSuccessRates).forEach(source => {
      const data = stats.sourceSuccessRates[source];
      data.successRate = data.successes / (data.successes + data.attempts);
    });
    
    const totalResults = Array.from(this.discoveryHistory.values())
      .reduce((sum, d) => sum + d.resultsFound, 0);
    stats.averageResultsPerQuery = totalResults / this.discoveryHistory.size;
    
    return stats;
  }
}

module.exports = PhilosophicalTextDiscovery; 