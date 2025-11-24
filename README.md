# ZeroStack

**Build Databases Like Spreadsheets**

ZeroStack is a modern no-code database platform that combines the simplicity of spreadsheets with the power of databases. Create powerful databases, APIs, and workflows without writing code.

![ZeroStack](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8)

## Features

### Core Features
- 📊 **Spreadsheet Interface** - Familiar spreadsheet-like interface that anyone can use
- 🗄️ **Real Database Power** - Behind the scenes, it's a real database with relationships and validations
- ⚡ **Instant APIs** - RESTful API routes ready for backend integration
- 🔒 **Secure by Default** - Enterprise-grade security with role-based access control
- 👥 **Real-time Collaboration** - Work together with your team in real-time
- ☁️ **Cloud Native** - Access your data from anywhere with automatic backups

### New Enhancements (v0.2.0)
- 🎨 **Dark Mode** - Full dark mode support with system preference detection
- 💾 **Persistent Storage** - Zustand store with localStorage persistence
- 📤 **CSV Import/Export** - Import and export data in CSV and JSON formats
- 🔍 **Advanced Search** - Real-time search across all columns
- 🔢 **Column Sorting** - Sort data by any column (ascending/descending)
- 📊 **Enhanced Column Types** - Text, Number, Date, Select, Checkbox, Email, URL
- 🎯 **Type-Safe State** - Full TypeScript support with Zustand store
- 🚀 **API Routes** - Complete REST API structure ready for backend

### Latest: NocoDB-Style Interface (v0.3.0)
- 🎭 **Multiple View Types** - Grid, Gallery, Form, and Kanban views
- 🔧 **Advanced Toolbar** - Fields, Filter, Sort, Group, and Colour controls
- 👁️ **Field Visibility** - Show/hide columns per view
- 🎯 **Multi-Filter System** - Complex filtering with multiple operators
- 📊 **Multi-Column Sort** - Sort by multiple fields simultaneously
- 🗂️ **View Management** - Create unlimited views per table
- 🎨 **Professional UI** - NocoDB/Airtable-inspired design
- 📱 **Collapsible Sidebar** - More screen space for your data

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Txshaa90/ZeroStack.git
cd ZeroStack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

ZeroStack offers **two workspace interfaces**:

### **1. NocoDB-Style Interface** (Recommended)
Navigate to `/workspace/nocodb` for the full-featured interface with:
- Multiple view types (Grid, Gallery, Form, Kanban)
- Advanced filtering and sorting
- Field visibility controls
- Collapsible sidebar
- Professional NocoDB/Airtable-inspired design

### **2. Simple Interface**
Navigate to `/workspace` for a streamlined, minimal interface

### Creating a New Table

1. Navigate to the workspace
2. Click the "New Table" or "Create New" button
3. Enter a table name and click "Create Table"

### Adding Columns

1. Select a table from the sidebar
2. Click "Add Column" in the table header
3. Enter column name and select the column type (Text, Number, Date, Select, Checkbox)
4. Click "Add Column" to create

### Adding Data

1. Click "Add Row" to create a new row
2. Click on any cell to edit its value
3. Changes are saved automatically

### Managing Tables

- **Rename**: Click the three dots next to a table name and select "Rename"
- **Export**: Export your table data to CSV or JSON
- **Delete**: Remove a table and all its data

## Project Structure

```
zerostack/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── workspace/         # Workspace pages
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   └── ui/               # UI components (shadcn/ui)
├── lib/                  # Utility functions
├── public/               # Static assets
└── package.json          # Dependencies
```

## Features Roadmap

### Completed ✅
- [x] Advanced filtering and sorting
- [x] Import/Export (CSV, JSON)
- [x] Dark mode support
- [x] API route structure
- [x] State management with Zustand
- [x] Persistent local storage

### In Progress 🚧
- [ ] Backend database integration (PostgreSQL/Supabase)
- [ ] User authentication and authorization (NextAuth.js)
- [ ] Real-time collaboration (WebSockets/Supabase Realtime)

### Planned 📋
- [ ] Database relationships (foreign keys)
- [ ] Data validation rules
- [ ] Formula fields (=SUM, =AVG, etc.)
- [ ] Webhooks and automation
- [ ] Views and saved filters
- [ ] File attachments
- [ ] Conditional formatting
- [ ] Mobile responsive design improvements
- [ ] Bulk operations
- [ ] Undo/Redo functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [NocoDB](https://nocodb.com/) and [Airtable](https://airtable.com/)
- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For support, email support@zerostack.com or join our Discord community.

---

Made with ❤️ by the ZeroStack team
