# Development and Interface Guidelines: Household Financial System

This document defines the core principles for developing components of the Household Financial System. The goal is to build a stable, responsible, and transparent interface that provides users with an accurate view of their financial status.

## 1. Design and Style Principles

*   **Conservatism and Resilience:** The design should convey stability, reliability, and tranquility. Use a calm color palette (e.g., deep greens, dark blues, muted grays).
*   **Clarity:** Every page must begin with a clear title and a summary of the primary metric (e.g., total assets/liabilities).
*   **Consistency:** The UI components (tables, buttons, modals) must be identical in structure and style across all system modules.
*   **Icons:** Use standard, clear iconography to represent asset/liability types.

## 2. User Experience and Functionality

*   **Data Entry (Explicit Action):** The interface must be intentional. Selecting a category button does not automatically create a row. A row is only instantiated upon an explicit user action: clicking "Add Row" or selecting an item from the "Smart Suggestions" modal.
*   **Smart Suggestions Feature:**
    *   **Placement:** The button must be positioned at the top of the data table area.
    *   **Mechanism:** Clicking this button opens a modal window containing a table of suggested financial entries for quick selection.
    *   **Bell Icon:** Each suggestion row within the modal must contain a bell icon. Clicking the bell schedules the item for a later reminder.
    *   **Visual Feedback:** When an item is marked with a bell, the corresponding Category button (in the main sidebar/list) must display a red badge (circle) with a numeric count representing the number of pending entries for that specific category.
*   **Data Validation:** All input amounts must be processed as numbers only, with thousands separators for readability (e.g., 2,500,000 ₪).
*   **Deletion and Control:** Every manually entered item must have a quick delete option.
*   **Automated Summary:** Any change in value or addition of an item must update the main summary card immediately.

## 3. Business Logic

*   **Mathematical Precision:** The total sum must be recalculated on every re-render of the data to ensure accuracy.
*   **Data Structure:** The system must use a consistent data structure for each category, allowing for future expansion (adding new categories without breaking existing code).
*   **Responsibility:** Any financial analysis displayed must be presented as a general recommendation only, emphasizing conservative risk management.

## 4. Maintenance and Development

*   **Consistency:** Every page in the system must adopt the same hierarchy: 
    *   Title -> Summary Cards -> Item List (with Smart Suggestions button at the top).
*   **Single-File Architecture:** Each component/page must be provided as a single file including all logic and design, without complex external dependencies.

---
*Note: The system is intended to serve as a tool for managing a private household. Interaction must remain respectful, professional, and non-judgmental.*