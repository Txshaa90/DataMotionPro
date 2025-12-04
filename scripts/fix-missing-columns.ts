import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixMissingColumns() {
  console.log('🔧 Starting to fix missing columns...')
  
  // Get all tables
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
  
  if (tablesError) {
    console.error('❌ Error fetching tables:', tablesError)
    return
  }
  
  console.log(`📊 Found ${tables?.length || 0} tables`)
  
  for (const table of tables || []) {
    console.log(`\n📋 Processing table: ${table.name} (${table.id})`)
    
    // Get views for this table
    const { data: views, error: viewsError } = await supabase
      .from('views')
      .select('*')
      .eq('table_id', table.id)
    
    if (viewsError) {
      console.error(`❌ Error fetching views for table ${table.id}:`, viewsError)
      continue
    }
    
    // Collect all unique column names from all views' rows
    const allColumnKeys = new Set<string>()
    
    for (const view of views || []) {
      if (view.rows && Array.isArray(view.rows) && view.rows.length > 0) {
        const sampleRow = view.rows[0]
        Object.keys(sampleRow)
          .filter(key => key !== 'id')
          .forEach(key => allColumnKeys.add(key))
      }
    }
    
    const columnKeys = Array.from(allColumnKeys)
    console.log(`   Found ${columnKeys.length} unique columns:`, columnKeys.slice(0, 5), '...')
    
    if (columnKeys.length === 0) {
      console.log('   ⚠️  No columns found in rows, skipping...')
      continue
    }
    
    // Create column definitions
    const columns = columnKeys.map(key => ({
      id: key,
      name: key,
      type: 'text',
      width: 200
    }))
    
    // Update table with columns
    const { error: updateError } = await supabase
      .from('tables')
      .update({ columns })
      .eq('id', table.id)
    
    if (updateError) {
      console.error(`   ❌ Error updating columns:`, updateError)
    } else {
      console.log(`   ✅ Updated ${columns.length} columns successfully!`)
    }
    
    // Update all views to have correct visible_columns
    for (const view of views || []) {
      const { error: viewUpdateError } = await supabase
        .from('views')
        .update({ visible_columns: columnKeys })
        .eq('id', view.id)
      
      if (viewUpdateError) {
        console.error(`   ❌ Error updating view ${view.name}:`, viewUpdateError)
      } else {
        console.log(`   ✅ Updated visible columns for view: ${view.name}`)
      }
    }
  }
  
  console.log('\n🎉 Done! Refresh your browser to see the changes.')
}

fixMissingColumns()
