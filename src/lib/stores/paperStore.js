import { writable } from 'svelte/store';

export const papers = writable([]);

export function addPaper(paper) {
  console.log('Adding paper to store:', paper);
  papers.update(existingPapers => {
    const updatedPapers = [...existingPapers, paper];
    console.log('Updated papers store:', updatedPapers);
    return updatedPapers;
  });
}

export function updatePaperEditability(paperId, isEditable) {
  console.log('Updating paper editability:', { paperId, isEditable });
  papers.update(existingPapers => {
    const updatedPapers = existingPapers.map(paper => 
      paper.questionPaperId === paperId 
        ? { ...paper, isEditable } 
        : paper
    );
    console.log('Papers after editability update:', updatedPapers);
    return updatedPapers;
  });
} 