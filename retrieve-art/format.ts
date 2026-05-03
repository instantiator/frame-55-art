/**
 * Prints data to the console in the specified format.
 * 
 * @param data The array of objects to format and print.
 * @param format The desired output format ('table', 'json', or 'csv').
 */
export function formatOutput(data: any[], format: 'table' | 'json' | 'csv') {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else if (format === 'csv') {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    console.log(keys.join(','));
    data.forEach(item => {
      console.log(keys.map(key => `"${String(item[key]).replace(/"/g, '""')}"`).join(','));
    });
  } else {
    // Basic table formatting
    if (data.length === 0) {
      console.log('No results found.');
      return;
    }
    console.table(data);
  }
}
