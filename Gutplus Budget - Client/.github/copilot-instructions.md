# Project Context & Rules

## Project Technology Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeOrm, PostgreSQL
- Testing: Jest, React Testing Library
- Version Control: Git, GitHub
- CI/CD: GitHub Actions, Docker

## Code Style Guidelines
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

## Backend Logic Rules
- **Controller/Service Separation**: Controllers handle HTTP (req/res), Services handle business logic. Never put SQL/TypeORM logic inside a Controller.
- Services should be implemented as Classes and exported as singletons. Controllers should import these instances to handle business logic.
- **Error Handling**: Use a global error-handling middleware. Services should throw descriptive errors, and Controllers should catch them.
- **Async/Await**: Always use async/await for asynchronous operations; avoid callback hell.
- **Security**: Always use Helmet middleware for security headers and ensure that sensitive information (like passwords) is never returned in API responses. Use @Exclude() from class-transformer or manually delete sensitive fields.
- **API Response Structures**: Ensure consistent API response structures. Success responses should follow: { "success": true, "data": ... }. Error responses should follow: { "success": false, "message": "...", "error": "..." }.
# Project Context & Rules

## Project Technology Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeOrm, PostgreSQL
- Testing: Jest, React Testing Library
- Version Control: Git, GitHub
- CI/CD: GitHub Actions, Docker

## Code Style Guidelines
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
- Encourage code reviews and pair programming to share knowledge and improve code quality across the team.
- Stay updated with the latest best practices and trends in the technologies used in the project, and continuously improve the codebase accordingly.

# Project Context & Rules

## Project Technology Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeOrm, PostgreSQL
- Testing: Jest, React Testing Library
- Version Control: Git, GitHub
- CI/CD: GitHub Actions, Docker

## Code Style Guidelines
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

## Frontend & UI Design Rules (Financial & Clean Look)
### 1. Color Palette Definitions
- **Primary / Text:** `#163351` (Navy) - Use for all headings, primary text, and secondary/outline buttons. 
- **CTA / Accent:** `#358383` (Teal) - Use for primary buttons, active states, important icons, and highlights.
- **Background:** `#F1F5F9` (Soft Blue-Grey) - Use as the main background for the entire page.
- **Surface:** `#FFFFFF` (Pure White) - Use for cards, input fields, and navigation menus.

### 2. UI/UX Principles
- **Spacing & Padding:** Be generous with white space. Use at least `p-6` or `p-8` for containers to ensure a "breathing" layout.
- **Visual Hierarchy:** Use font weights (`font-bold` for Navy headers) to differentiate between data types. Primary data should be Navy, secondary descriptors in a lighter slate grey.
- **Corners & Shadows:** Use `rounded-xl` or `rounded-2xl` for cards. Apply `shadow-sm` for standard cards and `shadow-md` for hovered/active elements.
- **Minimalist Icons:** Use `lucide-react` icons exclusively. Keep `strokeWidth={1.5}` for a thin, professional look.
- **Interactive Elements:** Add subtle transitions (`transition-all duration-300`). Buttons should have a slight scale or shadow shift on hover.
- **Financial Clarity:** For data tables and lists, use a "Zebra" layout or subtle borders (`border-slate-100`) to maintain readability without clutter.

### 3. React Frontend Best Practices
- **Functional Components:** Always use functional components with hooks.
- **Tailwind Efficiency:** Avoid arbitrary values; stick to the defined palette or Tailwind's default scales unless specified.
- **Accessibility:** Ensure all interactive elements have ARIA labels and correct focus states.
- **Data Loading:** Implement "Skeleton Screens" using a pulse animation while fetching financial data to maintain the UI structure.

## Backend Logic Rules
- **Controller/Service Separation**: Controllers handle HTTP (req/res), Services handle business logic. Never put SQL/TypeORM logic inside a Controller.
- Services should be implemented as Classes and exported as singletons. Controllers should import these instances to handle business logic.
- **Error Handling**: Use a global error-handling middleware. Services should throw descriptive errors, and Controllers should catch them.
- **Async/Await**: Always use async/await for asynchronous operations; avoid callback hell.
- **Security**: Always use Helmet middleware for security headers and ensure that sensitive information (like passwords) is never returned in API responses. Use @Exclude() from class-transformer or manually delete sensitive fields.
- **API Response Structures**: Ensure consistent API response structures. Success responses should follow: { "success": true, "data": ... }. Error responses should follow: { "success": false, "message": "...", "error": "..." }.