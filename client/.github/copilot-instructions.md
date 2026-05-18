# Project Context & Rules

## 1. Project Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeOrm, PostgreSQL
- **Testing**: Jest, React Testing Library
- **Version Control**: Git, GitHub
- **CI/CD**: GitHub Actions, Docker

---

## 2. Code Style Guidelines
- **Naming Conventions**:
  - Use `camelCase` for variable and function names.
  - Use `PascalCase` for component and class names.
  - Use `snake_case` for database table and column names.
- **Formatting**:
  - Use 2 spaces for indentation.
  - Limit lines to 80 characters.
  - Use single quotes for strings (unless the string contains a single quote).
  - Always use semicolons at the end of statements.
- **Best Practices**:
  - Use descriptive names; avoid abbreviations unless widely understood.
  - Use JSDoc comments for functions and classes to describe purpose, parameters, and return values.
  - Organize imports: 1. External libraries, 2. Internal modules, 3. Styles.
  - Avoid inline styles; prefer Tailwind CSS classes.
  - Write unit tests for all functions and components.
  - Regularly review and refactor code to maintain quality and readability.

---

## 3. Frontend & UI Design Rules (Financial & Clean Look)

### Color Palette Definitions
- **Primary / Text**: `#163351` (Navy) - Headings, primary text, and secondary buttons.
- **CTA / Accent**: `#358383` (Teal) - Primary buttons, active states, and important icons.
- **Background**: `#F1F5F9` (Soft Blue-Grey) - Main background layer for the app.
- **Surface**: `#FFFFFF` (Pure White) - Cards, input fields, and navigation menus.

### UI/UX Principles
- **Spacing**: Be generous with white space. Use at least `p-6` or `p-8` for containers.
- **Visual Hierarchy**: Use `font-bold` for Navy headers. Secondary descriptors should be in a lighter slate grey.
- **Corners & Shadows**: Use `rounded-xl` or `rounded-2xl` for cards. Apply `shadow-sm` for standard cards and `shadow-md` for hover states.
- **Icons**: Use `lucide-react` icons exclusively with `strokeWidth={1.5}`.
- **Interactions**: Add subtle transitions (`transition-all duration-300`). Use slight scale or shadow shifts on hover.
- **Data Clarity**: Use "Zebra" layouts or subtle borders (`border-slate-100`) for financial tables and lists.

### React Specifics
- Always use **Functional Components** with Hooks.
- Ensure all interactive elements have ARIA labels and correct focus states.
- Implement **Skeleton Screens** with pulse animations during data fetching.

---

## 4. Backend Logic Rules
- **Architecture**: Separate Controllers (HTTP) from Services (Business Logic). Never put SQL/TypeORM logic inside a Controller.
- **Services**: Implement as Classes and export as singletons.
- **Error Handling**: Use a global error-handling middleware. Services should throw descriptive errors.
- **Security**: 
  - Always use `async/await` for asynchronous operations.
  - Use **Helmet** middleware for security headers.
  - Never return sensitive info (like passwords) in API responses (use `@Exclude()` or manual deletion).
- **API Response Structure**:
  - Success: `{ "success": true, "data": ... }`
  - Error: `{ "success": false, "message": "...", "error": "..." }`