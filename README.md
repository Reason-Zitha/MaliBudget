# MaliBudget

MaliBudget is a web-based personal and household budgeting application.
It helps users plan their income, estimate the money available after
planned costs, manage grocery lists, record expenses, and review their
financial overview.

## Features

-   **User accounts:** Register and sign in with an email address and
    password using Firebase Authentication.
-   **Financial overview:** View income, planned bills, grocery budget,
    and remaining money.
-   **Budget planner:** Enter income, bills, grocery allocation,
    future/savings allocation, and the number of weeks to plan for.
-   **Grocery list:** Add and manage grocery items, including quantities
    and prices.
-   **Expense tracker:** Record expenses with a description, category,
    amount, and date.
-   **CSV export:** Export recorded expenses to a CSV file.
-   **Feedback:** Send suggestions or feedback from the public landing
    page.
-   **Data persistence:** Store a user's application state in Cloud
    Firestore and keep a per-user browser backup in LocalStorage.

## Technologies

  -----------------------------------------------------------------------
  Technology                          Purpose
  ----------------------------------- -----------------------------------
  HTML5                               Defines the structure and pages of
                                      the application

  CSS3                                Provides styling, layout, and
                                      responsive presentation

  JavaScript (ES modules)             Implements the application logic,
                                      calculations, form handling, and
                                      Firebase communication

  Firebase Authentication             Handles email/password registration
                                      and sign-in

  Cloud Firestore                     Stores each signed-in user's
                                      budgeting state and submitted
                                      feedback

  Browser LocalStorage                Keeps a local backup of the
                                      signed-in user's budgeting state

  Lucide                              Supplies interface icons

  Vercel                              Hosts the deployed static web
                                      application

  Git and GitHub                      Source control and repository
                                      hosting
  -----------------------------------------------------------------------

MaliBudget is a static frontend application that uses Firebase as a
backend service. The project does not include a custom Node.js, PHP,
Java, or Python application server.

## Project structure

``` text
MaliBudget/
├── landing.html                 # Public landing page
├── landing.css                  # Landing page styles
├── landing.js                   # Landing navigation and feedback submission
├── login.html                   # Login and registration page
├── index.html                   # Financial overview/dashboard
├── overview.html                 # Additional overview page
├── budget.html                   # Budget planner page
├── groceries.html                # Grocery list page
├── expenses.html                 # Expense tracking page
├── style.css                     # Shared application styles
├── script.js                     # Budget, grocery, expense, and data logic
├── firebase.js                   # Firebase app, Authentication, and Firestore setup
├── firestore-feedback-rules.txt  # Firestore rules supplied for feedback
├── malibudget-logo.png           # Application logo
├── vercel.json                   # Vercel routing configuration
└── .gitignore                    # Files excluded from Git
```

## How the application works

1.  A visitor opens the site. Vercel is configured to serve
    `landing.html` at the root URL.
2.  The user can open the login page and register or sign in with
    Firebase Authentication.
3.  The application checks the authentication state before loading the
    budgeting pages.
4.  After sign-in, `script.js` loads the user's state from Firestore. If
    the user has no Firestore state yet, the application can initialise
    it using available browser data.
5.  The user can update the budget, grocery list, or expense list.
6.  The application updates the interface, saves a browser backup in
    LocalStorage, and writes the state to Firestore.
7.  The landing page feedback form writes feedback documents to the
    Firestore `feedback` collection.

## Budget calculation

The dashboard calculates planned remaining money using:

``` text
Remaining money = Income - Bills - Grocery budget - Future allocation
```

The budget planner also uses the remaining amount and the number of
weeks entered by the user to calculate weekly and daily planning
amounts.

All amounts are displayed in South African rand (R).

## Firebase setup

The project uses Firebase JavaScript SDK version 13.0.0 through Google's
hosted ES module URLs.

To connect the project to your own Firebase environment:

1.  Create a project in the [Firebase
    Console](https://console.firebase.google.com/).
2.  Register a Web App in that Firebase project.
3.  Enable **Email/Password** under Authentication sign-in providers.
4.  Create a Cloud Firestore database.
5.  Configure the Firebase web app settings in `firebase.js`.
6.  Keep the Firebase configuration used by the inline module in
    `login.html` consistent with `firebase.js`.
7.  Configure and deploy Firestore security rules for the data used by
    the application.

The application stores user budgeting state at the following Firestore
document path:

``` text
users/{userId}/appData/state
```

The public landing page writes feedback to:

``` text
feedback/{feedbackDocumentId}
```

**Security note:** Review and deploy Firestore security rules that
ensure each signed-in user can access only their own data. The included
`firestore-feedback-rules.txt` concerns feedback and is not a complete
security policy for all application data. Do not deploy a database with
unrestricted read or write access.

The Firebase web configuration is included in client-side code because a
browser application needs it to connect to Firebase. Protect application
data with Firebase Authentication and Firestore Security Rules; do not
put service-account private keys or other server secrets in frontend
files.

## Run locally

Because the application uses JavaScript ES modules and Firebase imports,
run it through a local web server rather than opening the HTML file
directly with a `file://` URL.

One option is the **Live Server** extension in Visual Studio Code:

1.  Open the `MaliBudget` folder in VS Code.
2.  Install the Live Server extension if it is not already installed.
3.  Right-click `landing.html`.
4.  Select **Open with Live Server**.
5.  The application should open in your browser.

You need an internet connection for the Firebase SDK and Firebase
services.

## Deploy to Vercel

1.  Push the project to a GitHub repository.
2.  Sign in to [Vercel](https://vercel.com/).
3.  Select **Add New → Project** and import the GitHub repository.
4.  Use a lowercase Vercel project name, for example `malibudget`.
5.  This is a static HTML/CSS/JavaScript project, so no framework build
    command is required for the current setup.
6.  Deploy the project.
7.  Confirm that Firebase Authentication's authorised domains include
    the deployed domain.

The included `vercel.json` rewrites the root route (`/`) to
`landing.html`.

## Main source files

-   **`script.js`:** Defines the default application state, normalises
    saved data, handles local and Firestore persistence, updates the
    dashboard, processes budget forms, renders grocery and expense
    lists, and exports expenses.
-   **`firebase.js`:** Initialises the Firebase application and exports
    the Authentication and Firestore instances.
-   **`landing.js`:** Controls the mobile navigation and submits
    feedback to Firestore.
-   **`login.html`:** Contains the login and registration interface and
    uses Firebase Authentication functions.
-   **`style.css`:** Contains shared styles for the budgeting pages.
-   **`landing.css`:** Styles the public landing page.
-   **`vercel.json`:** Configures the root route for Vercel hosting.

## Limitations and future improvements

Possible future improvements include:

-   Monthly and yearly financial reports.
-   Spending charts and category summaries.
-   Recurring expenses.
-   Budget limit notifications.
-   More advanced expense filtering.
-   A password recovery interface.
-   Optional bank statement imports.

