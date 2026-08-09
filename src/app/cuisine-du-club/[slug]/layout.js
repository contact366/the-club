export async function generateMetadata({ params }) {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  return {
    title: `${title} | La Cuisine du Club – The Club`,
    description: `Découvrez la recette "${title}" partagée par un chef partenaire du Club. Recette gastronomique de la Riviera.`,
  };
}

export default function RecetteLayout({ children }) {
  return children;
}
