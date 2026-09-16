# Setting Up Lesson Planner

Welcome to the **Lesson Planner** project! Follow these instructions to download, set up, and run the application on your local machine for development.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (preferred package manager)
- [Git](https://git-scm.com/)

## 1. Download the App

To get started, clone the repository to your local machine:

```bash
git clone https://github.com/Siljan123/lesson-planner.git
cd lesson-planner
```

*(Note: Replace the URL above with the actual repository URL where you host the open-source project.)*

## 2. Install Dependencies

This project uses `pnpm` for package management. Install all required dependencies by running:

```bash
pnpm install
```

## 3. Environment Configuration

The application requires certain environment variables to function correctly, particularly for AI generation features and the database (Supabase).

1. Create a `.env` file in the root of the project.

2. Open the `.env` file and add your API keys and configuration:

```env
# Google Gemini API Key for AI generation features
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
NUXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NUXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
```

**Where to get these keys:**
- **GEMINI_API_KEY**: Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
- **Supabase Keys**: Create a new project on [Supabase](https://supabase.com/). You can find these keys under **Project Settings > API**.

## 4. Run the Development Server

Once your environment variables are set up, you can start the Nuxt development server:

```bash
pnpm dev
```

The application will start running at [http://localhost:3000](http://localhost:3000). Open this URL in your browser to view and interact with the app.

## 5. Building for Production

If you want to test the production build locally, run the following commands:

```bash
# Build the application
pnpm build

# Preview the production build
pnpm preview
```

## Need Help?
If you encounter any issues during setup, feel free to open an issue in the repository!
