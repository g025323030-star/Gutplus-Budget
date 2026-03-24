#Project Context & Rules

##Project Technology Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeOrm, PostgreSQL
- Testing: Jest, React Testing Library
- Version Control: Git, GitHub
- CI/CD: GitHub Actions, Docker

##Code Style Guidelines
- Use camelCase for variable and function names.
- Use PascalCase for component and class names.
- Use snake_case for database table and column names.
- Use 2 spaces for indentation.
- Limit lines to 80 characters.
- Use single quotes for strings, except when the string contains a single quote.
- Always use semicolons at the end of statements.
- Use descriptive names for variables, functions, and components.
- Avoid using abbreviations unless they are widely understood.
- Write comments to explain complex logic and decisions, but avoid obvious comments.
- Use JSDoc comments for functions and classes to describe their purpose, parameters, and return values.
- Organize imports in the following order: external libraries, internal modules, styles.
- Use absolute imports for internal modules when possible.
- Avoid using inline styles; prefer using Tailwind CSS classes or styled components.
- Write unit tests for all functions and components, aiming for high test coverage.
- Use meaningful commit messages that describe the changes made.  
- Follow the Git branching strategy: use feature branches for new features, bugfix branches for bug fixes, and main branch for stable releases.
- Regularly review and refactor code to maintain code quality and readability.
- Use GitHub Actions for continuous integration and deployment, ensuring that all tests pass before merging code into the main branch.
- Use Docker for containerization to ensure consistency across development and production environments.
- Document API endpoints using OpenAPI/Swagger for clear communication with frontend developers and other stakeholders.
- Ensure that all code is properly formatted and linted using tools like Prettier and ESLint before committing.
- Encourage code reviews and pair programming to share knowledge and improve code quality across the team.
- Stay updated with the latest best practices and trends in the technologies used in the project, and continuously improve the codebase accordingly.

###Database Schema Guidelines
- Use singular nouns for table names (e.g., `user`, `product`).
- Use lowercase letters for table and column names.
- Use underscores to separate words in table and column names (e.g., `first_name`, `created_at`).
- Define primary keys as `id` and use auto-incrementing integers for simplicity.
- Use foreign keys to establish relationships between tables, and name them using the format `{related_table}_id` (e.g., `user_id`).