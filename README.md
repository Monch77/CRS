# crs_flutter

A Flutter-based Courier Rating System application.

## Overview

This project is a cross-platform Flutter application for Android and iOS, replacing the previous React-based version. It includes push notifications, local notifications, and Supabase integration for real-time order updates.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:
- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the [online documentation](https://docs.flutter.dev/), which offers tutorials, samples, guidance on mobile development, and a full API reference.

### Installation
1. Clone the repository: `git clone https://github.com/Monch77/CRS.git`
2. Navigate to the project folder: `cd crs_flutter`
3. Install dependencies: `flutter pub get`
4. Run the app: `flutter run`

## Previous Version (React)

The original project was a Courier Rating System built with React, TypeScript, Tailwind CSS, and Supabase.

### Functionality (React Version)
- User authentication (admins and couriers)
- Order management (create, edit, delete)
- Courier management (add, edit, delete)
- Delivery rating system for clients
- Courier performance tracking

### Technologies (React Version)
- React 18
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, authentication)
- React Router
- Lucide React (icons)
- Date-fns (date handling)

### Installation (React Version)
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and add your Supabase keys
4. Run Supabase migrations from `supabase/migrations`
5. Start the project: `npm run dev`

### Project Structure (React Version)
- `/src/components` - React components
- `/src/context` - React contexts (AuthContext)
- `/src/lib` - Libraries and utilities (Supabase client)
- `/src/pages` - Application pages
- `/src/services` - Data services
- `/src/types` - TypeScript types
- `/src/utils` - Helper functions
- `/supabase/migrations` - SQL migrations for Supabase