export const CERTIFICATE_FONTS = [
  // Script Fonts (Professional)
  { name: "Marck Script", family: "Marck Script", category: "Script", weights: [400] },
  { name: "Great Vibes", family: "Great Vibes", category: "Script", weights: [400] },
  { name: "Pacifico", family: "Pacifico", category: "Script", weights: [400] },
  { name: "Dancing Script", family: "Dancing Script", category: "Script", weights: [400, 700] },
  { name: "Tangerine", family: "Tangerine", category: "Script", weights: [400, 700] },

  // Serif Fonts
  { name: "Playfair Display", family: "Playfair Display", category: "Serif", weights: [400, 500, 600, 700, 800, 900] },
  { name: "Cormorant Garamond", family: "Cormorant Garamond", category: "Serif", weights: [300, 400, 500, 600, 700] },
  { name: "Lora", family: "Lora", category: "Serif", weights: [400, 500, 600, 700] },
  { name: "Crimson Text", family: "Crimson Text", category: "Serif", weights: [400, 600, 700] },
  { name: "Garamond", family: "Garamond", category: "Serif", weights: [400, 700] },
  { name: "Georgia", family: "Georgia", category: "Serif", weights: [400, 700] },
  { name: "Merriweather", family: "Merriweather", category: "Serif", weights: [300, 400, 700, 900] },

  // Sans-Serif Fonts
  { name: "Montserrat", family: "Montserrat", category: "Sans-Serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Roboto", family: "Roboto", category: "Sans-Serif", weights: [300, 400, 500, 700, 900] },
  { name: "Open Sans", family: "Open Sans", category: "Sans-Serif", weights: [300, 400, 600, 700, 800] },
  { name: "Poppins", family: "Poppins", category: "Sans-Serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Inter", family: "Inter", category: "Sans-Serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Raleway", family: "Raleway", category: "Sans-Serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: "Helvetica", family: "Helvetica", category: "Sans-Serif", weights: [400, 700] },
  { name: "Arial", family: "Arial", category: "Sans-Serif", weights: [400, 700] },
]

export const FONT_WEIGHTS = {
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi-Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
}

export const getGoogleFontsUrl = () => {
  const fontFamilies = CERTIFICATE_FONTS.map((f) => {
    const weights = f.weights.join(";")
    return `${f.family.replace(/ /g, "+")}:wght@${weights}`
  }).join("&family=")
  return `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`
}
