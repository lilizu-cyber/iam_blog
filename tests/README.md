# Testing Guide

This directory contains unit and integration tests for the IAM Blog application.

## Test Structure

```
tests/
├── setup.js                 # Test configuration and setup
├── helpers/
│   └── mocks.js             # Common mocks and test utilities
├── unit/                    # Unit tests
│   ├── commandHandlers/     # Command handler tests
│   ├── queryHandlers/       # Query handler tests
│   └── projections/         # Projection tests
└── integration/            # Integration tests
    └── routes/             # API route tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only integration tests
```bash
npm run test:integration
```

## Test Coverage

The project aims for **>70% code coverage** across:
- Command handlers
- Query handlers
- Projections
- API routes

Coverage reports are generated in the `coverage/` directory after running `npm run test:coverage`.

## Setting Up Test Environment

1. Copy the test environment file:
   ```bash
   cp env.test.example .env.test
   ```

2. Ensure PostgreSQL test database exists:
   ```sql
   CREATE DATABASE iam_blog_test;
   ```

3. Run database migrations for test database:
   ```bash
   NODE_ENV=test npm run migrate:up
   ```

## Writing Tests

### Unit Tests

Unit tests should:
- Test individual functions/methods in isolation
- Use mocks for dependencies
- Be fast and deterministic
- Cover edge cases and error scenarios

Example:
```javascript
describe('MyClass', () => {
  it('should do something', () => {
    // Arrange
    const instance = new MyClass();
    
    // Act
    const result = instance.method();
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Integration tests should:
- Test multiple components working together
- Use real database connections (test database)
- Test API endpoints end-to-end
- Clean up after themselves

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

The CI pipeline:
1. Sets up PostgreSQL and Redis services
2. Runs all tests
3. Generates coverage reports
4. Uploads coverage to Codecov

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Reset mocks and database state between tests
3. **Naming**: Use descriptive test names
4. **AAA Pattern**: Arrange, Act, Assert
5. **Coverage**: Aim for >70% but focus on critical paths
6. **Speed**: Keep tests fast (< 10 seconds total)

## Troubleshooting

### Tests failing with database errors
- Ensure test database exists
- Check database connection string in `.env.test`
- Run migrations: `NODE_ENV=test npm run migrate:up`

### Tests timing out
- Increase timeout in `jest.config.js` if needed
- Check for hanging database connections
- Ensure mocks are properly reset

### Coverage not meeting threshold
- Run `npm run test:coverage` to see detailed report
- Focus on uncovered critical paths
- Add tests for error scenarios

