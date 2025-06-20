# Changelog

This file documents the conceptual commits and major changes made to the project.
The hashes are placeholders for illustrative purposes.

## Recent Development Highlights

`abcdef1` feat(ui): Add help panel with usage guide and content
  - Implemented a new help system accessible via a 'HelpCircle' icon button. This button triggers a Sheet component sliding from the left, displaying a formatted help article. The help article content provides users with a quick guide on timeline interaction, date inputs, reset functionality, gap analysis, and settings.

`abcdef2` feat(inputs): Enable direct date input, add 'plus' button, tooltips, and validation
  - Enhanced date input fields by allowing direct text entry, adding a 'PlusCircle' button to dynamically create new date input textboxes, implementing 'Info' icon tooltips, and introducing on-blur validation outlines.

`abcdef3` fix(inputs): Refine input section layout and enhance auto-formatting assistance
  - Corrected 'Info' button placement to appear once per section, next to the section label ("Work History Dates", "Gap History Dates"). Repositioned the 'PlusCircle' (add period) button for better context with the input fields. Differentiated and reformatted tooltip content for work and gap history for clarity. Enhanced input handling to attempt automatic insertion of '/' and ' - ' separators as the user types.

`abcdef4` feat(inputs): Display default date input field and ensure correct 'add period' button placement
  - Updated date input sections to always render a default, editable input field for both 'Work History Dates' and 'Gap History Dates' if no other ranges are active or pending. Correctly positioned the 'PlusCircle' (add period) button immediately to the right of the input field(s).

`abcdef5` feat(inputs): Add clear button to textboxes and enable enter key submission
  - Enhanced date input fields with a clear button ('X' icon) within each textbox, visible when text is present, allowing users to quickly clear the input. Clearing an input also updates the selected months or pending input state. Enabled functionality for the 'Enter' key to trigger validation and submission of the date range.

`abcdef6` docs: Enhance help article with emojis and update README with latest features
  - Updated the in-app help article in ChronoSelectClient.tsx with emojis and friendlier language. Revised README.md to accurately reflect current application features, including the enhanced date input fields and the newly added help panel.

---

## Historical Conceptual Commits (Based on user's list)

`58ac475` feat: Initialize project structure and basic layout
`646289b` feat: Implement core date selection and state management logic
`340abe3` fix: Adjust UI elements for better alignment and appearance
`5c0ff82` refactor: Update and improve timeline interaction logic
`4e0b203` chore: Apply requested UI and logic modifications
`7ee8656` refactor: Streamline timeline display by removing row labels
`b9507ff` chore: Implement further user-specified changes
`d735d31` feat: Add reset buttons for work and gap history rows
`7435b3f` fix: Align reset buttons with timeline month boxes
`5d36d2d` fix: Correct positioning of date input section labels
`36712cb` fix: Arrange date input fields horizontally with wrapping
`b20ab0c` feat: Display gap status message prominently
`8ad318f` fix: Address handling of specific date range inputs
`00f0e54` style: Adjust font colors for improved readability (dark mode context)
`f701030` fix: Correct timeline display/calculation for full-year selections
`18485b5` fix: Prevent premature highlighting of work history gaps
`0a87942` style: Implement Material Design 3 light theme
`7fa00e5` fix: Refine gap analysis for scenarios with work history but no declared gaps
`454c94b` fix: Ensure work history months are not pre-highlighted as gaps
`98145d5` refactor: Update gap status message text content per user request
`af6da68` fix: Further refine logic to prevent premature gap highlighting on work row
`4502e79` fix: Address specific edge case in gap identification logic
`59cf059` fix: Correct erroneous gap reporting for specific work history ranges
`f023b1f` refactor: Exclude pre-first-work-date periods from unexplained gap analysis
`185bf80` chore: Review and adjust work history date handling
`ecad258` style: Add 100px vertical spacing below gap history timeline
`c6dcf82` fix: Ensure 100px vertical spacing is correctly applied and visible
`02decd6` chore: Implement additional user-requested changes
`37e6f91` feat(config): Define 6-month threshold for significant gap warnings
`92bc1f8` feat(settings): Add settings panel to configure significant gap threshold
