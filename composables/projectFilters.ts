import type { Project } from '~/composables/usePortfolioData';

export function filterProjects(projects: Project[], filters: { query: string; technology: string; year: string; type: string }) {
  const query = filters.query.trim().toLocaleLowerCase('fr');
  return projects.filter((project) => {
    const matchesSearch = !query || `${project.title} ${project.description} ${project.tags.join(' ')} ${project.projectType || 'Web'}`
      .toLocaleLowerCase('fr').includes(query);
    const matchesTechnology = !filters.technology || project.tags.some((tag) => tag.toLocaleLowerCase('fr') === filters.technology.toLocaleLowerCase('fr'));
    const matchesYear = !filters.year || project.year === filters.year;
    const matchesType = !filters.type || (project.projectType || 'Web') === filters.type;
    return matchesSearch && matchesTechnology && matchesYear && matchesType;
  });
}
