const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const userId = '0aebc03e-defa-465d-ac65-b6c15806fd26'
  
  console.log('Checking for datasets...\n')
  
  const { data: tables, error } = await supabase
    .from('tables')
    .select('*')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${tables.length} datasets:\n`)
  tables.forEach(table => {
    console.log(`- ${table.name} (ID: ${table.id})`)
    console.log(`  Created: ${table.created_at}`)
    console.log(`  Folder: ${table.folder_id || 'None'}\n`)
  })
}

checkData()
