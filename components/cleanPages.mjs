async function cleanPages(data, document) {
  const pages = data.text.split(/(?=EXT\.)/); // Split based on "EXT." as a page marker
  const nonEmptyPages = pages.filter(page => page.trim() !== ""); // Remove empty pages

  const updatedDocument = {
      ...document,
      meta: {
          ...document.meta,
          pages: nonEmptyPages.length // Update the number of pages
      }
  };

  return updatedDocument;
}
