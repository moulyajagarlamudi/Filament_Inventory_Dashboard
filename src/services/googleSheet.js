import Papa from 'papaparse'

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5869PhC9g-w1DSXihd-ao9cGRrKmQ0csInWfhYrtYozDXo3m2YNBhglBgB4qia-v8ZWmTrmaMj7ak/pubhtml'

const INITIAL_STOCK = {
  'PLA Black': 1000,
  'PLA Red': 1000,
  'PLA White': 1000,
  'PETG Blue': 1000,
  'PETG Red': 1000,
  'ABS Black': 1000,
}

export async function fetchFilaments() {

  return new Promise((resolve) => {

    Papa.parse(SHEET_URL, {

      download: true,
      header: true,

      complete: (results) => {

        const usageMap = {}

        results.data.forEach(row => {

          const filament = row['Filament Used']
          const usedWeight = Number(row['Weight Used'] || 0)

          if (!filament) return

          if (!usageMap[filament]) {
            usageMap[filament] = 0
          }

          usageMap[filament] += usedWeight
        })

        const filamentData = Object.keys(INITIAL_STOCK).map((name, index) => {

          const total = INITIAL_STOCK[name]
          const used = usageMap[name] || 0
          const remaining = total - used

          return {
            id: index + 1,
            name,
            total,
            used,
            remaining,
          }
        })

        resolve(filamentData)
      },

      error: (error) => {
        console.error('Google Sheet Error:', error)
        resolve([])
      },
    })
  })
}