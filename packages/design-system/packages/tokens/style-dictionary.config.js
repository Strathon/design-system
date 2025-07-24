const StyleDictionary = require('style-dictionary');

// Custom transforms
StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: function(token) {
    return token.attributes.category === 'size' || 
           token.attributes.category === 'spacing' ||
           token.attributes.category === 'border-radius';
  },
  transformer: function(token) {
    return parseFloat(token.original.value) + 'px';
  }
});

StyleDictionary.registerTransform({
  name: 'shadow/css',
  type: 'value',
  matcher: function(token) {
    return token.attributes.category === 'shadow' || 
           token.attributes.category === 'elevation';
  },
  transformer: function(token) {
    return token.original.value;
  }
});

// Custom formats
StyleDictionary.registerFormat({
  name: 'css/variables-themed',
  formatter: function(dictionary) {
    const lightTokens = dictionary.allTokens
      .filter(token => token.path[0] === 'theme' && token.path[1] === 'light')
      .map(token => `  --${token.name.replace('theme-light-', '')}: ${token.value};`)
      .join('\n');
    
    const darkTokens = dictionary.allTokens
      .filter(token => token.path[0] === 'theme' && token.path[1] === 'dark')
      .map(token => `  --${token.name.replace('theme-dark-', '')}: ${token.value};`)
      .join('\n');

    const baseTokens = dictionary.allTokens
      .filter(token => token.path[0] !== 'theme')
      .map(token => `  --${token.name}: ${token.value};`)
      .join('\n');

    return `:root {\n${baseTokens}\n${lightTokens}\n}\n\n[data-theme="dark"] {\n${darkTokens}\n}`;
  }
});

StyleDictionary.registerFormat({
  name: 'typescript/es6-declarations',
  formatter: function(dictionary) {
    const tokens = dictionary.allTokens
      .map(token => {
        const path = token.path.join('.');
        return `  '${path}': '${token.value}'`;
      })
      .join(',\n');

    return `export const tokens = {\n${tokens}\n} as const;\n\nexport type TokenPath = keyof typeof tokens;`;
  }
});

module.exports = {
  source: ['src/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      transforms: ['attribute/cti', 'name/cti/kebab', 'size/px', 'shadow/css'],
      buildPath: 'dist/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables-themed'
        }
      ]
    },
    js: {
      transformGroup: 'js',
      transforms: ['attribute/cti', 'name/cti/camel', 'size/px', 'shadow/css'],
      buildPath: 'dist/js/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6'
        },
        {
          destination: 'tokens.d.ts',
          format: 'typescript/es6-declarations'
        }
      ]
    },
    json: {
      transformGroup: 'js',
      transforms: ['attribute/cti', 'name/cti/kebab', 'size/px', 'shadow/css'],
      buildPath: 'dist/json/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested'
        }
      ]
    }
  }
};
