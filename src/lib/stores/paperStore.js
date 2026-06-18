import { writable } from 'svelte/store';

export const papers = writable([]);

export function addPaper(paper) {
  papers.update(existingPapers => {
    const updatedPapers = [...existingPapers, paper];
    return updatedPapers;
  });
}

export function updatePaperEditability(paperId, isEditable) {
  papers.update(existingPapers => {
    const updatedPapers = existingPapers.map(paper => 
      paper.questionPaperId === paperId 
        ? { ...paper, isEditable } 
        : paper
    );
    return updatedPapers;
  });
} 