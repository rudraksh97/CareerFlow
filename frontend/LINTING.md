# Frontend Linting Setup

This document explains the comprehensive linting and code quality setup for the PATS frontend application.

## Overview

The frontend uses a modern linting stack focused on code quality, consistency, and maintainability:

- **ESLint** - JavaScript/TypeScript linting with comprehensive rules
- **Prettier** - Code formatting for consistent style
- **TypeScript** - Type checking and validation
- **Accessibility** - JSX accessibility rules for inclusive UI

## Tools and Configuration

### ESLint Configuration

The ESLint setup uses the modern flat config format (`eslint.config.js`) with:

- **TypeScript Support** - Full TypeScript linting with type-aware rules
- **React/JSX Rules** - React-specific linting including hooks and refresh
- **Accessibility Rules** - JSX-a11y for accessible component development
- **Import Organization** - Automatic import sorting and organization
- **Code Quality Rules** - Complexity limits, best practices enforcement

### Prettier Configuration

Prettier is configured for consistent code formatting with:
- Single quotes for strings
- 2-space indentation
- 100 character line length
- Trailing commas where valid
- Semicolons required
- JSX single quotes

### Global Variables

Browser and Node.js globals are pre-configured including:
- Standard browser APIs (window, document, fetch, etc.)
- Event types and DOM elements
- Node.js globals for build tools
- React and development tool globals

## Available Scripts

### Core Linting Commands

```bash
# Run ESLint on all source files
npm run lint

# Run ESLint with automatic fixes
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:check

# Run TypeScript type checking
npm run type-check

# Run all quality checks (lint + format + types)
npm run quality
```

### Development Workflow

1. **During Development**: Use VS Code with the recommended extensions for real-time linting
2. **Before Committing**: Run `npm run quality` to ensure all checks pass
3. **Auto-fixing**: Use `npm run lint:fix` and `npm run format` for automatic corrections

## VS Code Integration

The setup includes VS Code settings (`.vscode/settings.json`) for optimal development experience:

- **Format on Save** - Automatic Prettier formatting
- **Auto-fix on Save** - ESLint fixes applied automatically
- **Import Organization** - Automatic import sorting
- **Type Checking** - Real-time TypeScript validation

### Recommended Extensions

Install these VS Code extensions for the best experience:
- ESLint (`esbenp.prettier-vscode`)
- Prettier (`esbenp.prettier-vscode`)
- TypeScript and JavaScript Language Features (built-in)

## Rule Configuration

### Code Quality Rules

- **Complexity Limits**: Functions limited to complexity of 10
- **Line Length**: Maximum 100 characters
- **Indentation**: 2 spaces consistently
- **No Console**: Console statements flagged as warnings
- **Type Safety**: `any` type usage discouraged

### React-Specific Rules

- **Hooks Rules**: Proper hooks usage enforced
- **Component Patterns**: Self-closing components, fragment syntax
- **JSX Best Practices**: Proper prop handling, no unused expressions

### Accessibility Rules

- **Keyboard Navigation**: Click handlers require keyboard equivalents
- **ARIA Properties**: Proper ARIA usage validation
- **Semantic HTML**: Proper heading structure and alt text

### Import Organization

Imports are automatically organized into groups:
1. Built-in Node.js modules
2. External dependencies
3. Internal modules
4. Parent directory imports
5. Sibling/index imports

## Current Status

After initial setup and auto-fixing:
- **Total Issues**: 69 (12 errors, 57 warnings)
- **Auto-fixable**: Most formatting and simple issues resolved
- **Manual Review**: Complex functions, type definitions, accessibility

### Remaining Issue Types

1. **Complexity Warnings** - Functions that exceed complexity limits
2. **Type Safety** - Usage of `any` type (warnings)
3. **Development Code** - Console statements and debugging code
4. **Code Structure** - Nested ternary expressions, unused variables

## Best Practices

### Writing Clean Code

1. **Keep Functions Simple**: Break down complex functions (complexity < 10)
2. **Use Proper Types**: Avoid `any`, define specific interfaces
3. **Handle Accessibility**: Add keyboard handlers for interactive elements
4. **Remove Debug Code**: Clean up console.log statements before committing

### Code Organization

1. **Import Order**: Follow the configured import grouping
2. **Component Structure**: Use consistent patterns for components
3. **Error Handling**: Proper error boundaries and validation
4. **Performance**: Avoid unnecessary re-renders and complex nested logic

### Team Consistency

1. **Run Quality Checks**: Always run `npm run quality` before pushing
2. **Fix Auto-fixable Issues**: Use the auto-fix commands regularly
3. **Address Warnings**: Don't ignore linting warnings, they indicate potential issues
4. **Code Reviews**: Use linting results to guide code review discussions

## Configuration Files

- `eslint.config.js` - ESLint configuration with comprehensive rules
- `.prettierrc` - Prettier formatting configuration
- `.prettierignore` - Files to exclude from formatting
- `.vscode/settings.json` - VS Code editor settings
- `tsconfig.json` - TypeScript configuration (type checking)

## Customization

### Adjusting Rules

To modify linting rules, edit `eslint.config.js`:

```javascript
rules: {
  // Example: Change max line length
  'max-len': ['error', { code: 120 }],
  
  // Example: Allow console in development
  'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  
  // Example: Adjust complexity limit
  'complexity': ['warn', 15],
}
```

### Adding New Rules

Add new ESLint plugins and rules as needed:

```bash
npm install --save-dev eslint-plugin-example
```

Then configure in `eslint.config.js`:

```javascript
import examplePlugin from 'eslint-plugin-example';

plugins: {
  'example': examplePlugin
},
rules: {
  'example/rule-name': 'error'
}
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Ensure all dependencies are installed
2. **TypeScript path errors**: Check `tsconfig.json` path mapping
3. **Prettier conflicts**: Ensure ESLint and Prettier rules don't conflict
4. **VS Code not auto-fixing**: Check extension installation and settings

### Performance

If linting is slow:
- Exclude unnecessary files via `.eslintignore` patterns
- Use `eslint --cache` for faster subsequent runs
- Consider running type checking separately for large projects

### Getting Help

- Check ESLint documentation: https://eslint.org/docs/
- Prettier documentation: https://prettier.io/docs/
- TypeScript ESLint: https://typescript-eslint.io/
- React ESLint plugin: https://github.com/jsx-eslint/eslint-plugin-react

This setup provides a solid foundation for maintaining high code quality and consistency across the frontend codebase while supporting the user's preference for clean, minimalist code [[memory:2880435]]. 