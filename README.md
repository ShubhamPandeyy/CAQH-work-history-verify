# Pandey's Work History Visualizer: An Advanced Temporal Analysis Tool 🚀

> A personal project exploring complex state management and dynamic UI with React and Next.js. This tool is designed to help users visually map out and analyze their professional history with precision.

As a developer, I'm always looking for interesting challenges. I built this visualizer as a deep dive into creating a highly interactive, stateful application. The goal was to build a tool that was not only functional but also intuitive and polished, tackling the complexities of date-range calculations, dynamic UI rendering, and persistent user settings.

---

## ✨ Core Features

### 1. The Dynamic Timeline 🗓️
The heart of the application is a responsive temporal grid designed for clarity and detail.

*   **5-Year Rolling Horizon**: The timeline displays a full 61-month period (the last 5 years plus the current month), which automatically adjusts based on the current date.
*   **Interactive Selection**: Users can visually define work or gap periods with just two clicks—a start month and an end month. The tool automatically highlights the range.
    *   **Work History**: Marked in a distinct green.
    *   **Gap History**: Marked in a complementary brown for easy differentiation.
*   **Hover Tooltip**: For enhanced accessibility and ease of use, hovering over any month tile displays its full date (e.g., `(05) May 2021`). This can be toggled in the settings.
*   **Adaptive Layout**: The entire grid is responsive. Month tiles and year labels dynamically resize to fit the available screen space, ensuring usability on any device.

### 2. Advanced Data Input & Control ✍️
Data entry is designed to be flexible and forgiving, accommodating both visual and manual input styles.

*   **Bidirectional Sync**: Selections made on the visual timeline instantly generate corresponding date range textboxes below.
*   **Direct Manual Entry**: Users can type dates directly into the input fields (`MM/YYYY` or `MM/YYYY - MM/YYYY`). Validated entries will immediately update the visual timeline.
*   **Input Assistance**:
    *   **Smart Formatting**: The app helps guide users by auto-inserting `/` and ` - ` separators where appropriate.
    *   **Live Validation**: Inputs get a subtle **green outline** for valid dates and a **red outline** for invalid formats, providing immediate feedback.
    *   **Quick Actions**: Each input has a clear (`X`) button, and pressing "Enter" submits the date for validation.
    *   **Add New Ranges**: A `+` button lets users add new date range fields on the fly.

### 3. Intelligent Gap Analysis 🧐
The tool goes beyond simple tracking by performing a heuristic analysis of the user's timeline.

*   **Unexplained Gap Detection**: The system intelligently identifies periods *after* the first work entry that are not accounted for by either "Work History" or "Gap History".
*   **Configurable Threshold**: What's a "significant" gap? The user decides! The default is 6 months, but this can be adjusted in the settings.
*   **Visual Alerts**: Significant, unexplained gaps are highlighted with a distinct outline on the "Work History" row, drawing attention to periods that may need an explanation.
*   **Color-Coded Status Messages**: The app provides clear, dynamic, and color-coded feedback at the bottom of the page based on its analysis.

### 4. Personalization & Settings 🛠️
A slide-out settings panel allows users to tailor the experience to their needs.

*   **User Profile**: A welcoming touch that allows users to set their display name.
*   **Customizable Messages**: Users can edit the default status messages for "No Gaps," "Explained Gaps," and "Unexplained Gaps."
*   **Timeline Toggles**: Users can enable or disable the month hover tooltip.
*   **Persistent Configuration**: All settings—the gap threshold, user profile, custom messages, and UI toggles—are saved in the browser's `localStorage`, so they're remembered for the next session.

### 5. Built-in Guidance ❓
To ensure a smooth user experience, the app includes integrated help.
*   **Help Panel**: A dedicated help icon opens a slide-out guide explaining every feature.
*   **Tooltips**: "Info" icons next to the date input sections and status message provide quick, contextual tips.

---

## 🛠️ Tech Stack

This project was built with a modern, performant, and type-safe technology stack:

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **UI Library**: [React](https://reactjs.org/)
*   **Component Library**: [ShadCN UI](https://ui.shadcn.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **State Management**: React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)

---

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 18.x or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ShubhamPandeyy/CAQH-work-history-verify
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd your-project-directory
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

To start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) (or the port specified in `package.json`) in your browser to see the application.

---

## ⚙️ Configuration

The primary user configurations are managed in the **Settings panel** (⚙️ icon):

*   **Minimum Significant Gap**: Adjust the month threshold for gap analysis (1-60).
*   **User Profile**: Set your display name.
*   **Status Messages**: Customize the text used for gap analysis feedback.
*   **UI Toggles**: Enable/disable UI features like the month hover tooltip.

All changes are saved automatically to your browser's local storage.

---

## 📜 License

This project is open-source and available for demonstration purposes. Feel free to explore the code!
