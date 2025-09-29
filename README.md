# Neighborhood Mapper

A Next.js application for mapping and naming neighborhoods.

## Features

- Interactive map to drop and name neighborhood locations
- Persistent storage with Supabase backend
- Group overlapping locations and show multiple neighborhood names
- Visualize saved locations as colored squares on the map

## Setup

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A Supabase account (free tier works fine)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Once your project is created, navigate to the SQL Editor
3. Run the SQL commands from the `db_schema.sql` file in this repository to create the required tables

### Environment Configuration

1. Copy the `.env.local.example` file to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Get your Supabase URL and anon key from your Supabase project dashboard:
   - Project Settings > API
   - Copy the URL and anon key
3. Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click anywhere on the map to place a marker
2. Enter a neighborhood name in the form
3. Click "Save Location" to save the location to Supabase
4. The neighborhood will appear as a colored square on the map
5. Click on a square to see the neighborhood name(s) for that location

## Database Structure

The application uses two main tables in Supabase:

1. `locations` - Stores the saved locations with their coordinates and names
2. `neighborhood_colors` - Stores consistent color assignments for each neighborhood

## Development

### Building for Production

```bash
npm run build
npm start
```

### Running Tests

```bash
npm test
```