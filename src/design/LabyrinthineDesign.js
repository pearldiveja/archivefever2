class LabyrinthineDesign {
  constructor() {
    this.aestheticPrinciples = {
      colors: {
        primary: '#1a1a1a',
        secondary: '#2d2d2d',
        accent: '#8b7355',
        text: '#e8e6e3',
        highlight: '#d4af37',
        danger: '#4a2c2a',
        success: '#4a5d23',
        info: '#2a3f5f'
      },
      
      fonts: {
        body: 'Georgia, "Times New Roman", serif',
        headers: 'Optima, "Helvetica Neue", sans-serif',
        code: 'Monaco, "Courier New", monospace'
      },
      
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem'
      }
    };
  }

  getColors() {
    return this.aestheticPrinciples.colors;
  }

  getFonts() {
    return this.aestheticPrinciples.fonts;
  }

  getSpacing() {
    return this.aestheticPrinciples.spacing;
  }
}

module.exports = LabyrinthineDesign;
