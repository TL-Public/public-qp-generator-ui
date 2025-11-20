import { writable, derived } from "svelte/store";
import { api } from "$lib/utils/api.js";
import { selectedContentStore } from "$lib/stores/selectedContentStore.js";
import { cleanQuestionText } from "$lib/utils/textUtils.js";

export function createContentSelectionStore() {
  // internal state
  const isLoading = writable(false);
  const error = writable(null);
  const chaptersData = writable([]);
  const expandedChapters = writable(new Set());
  const expandedTopics = writable(new Set());
  const fetchedQuestions = writable([]);
  const showQuestions = writable(false);
  const activeTab = writable("questions");
  const highlightedItem = writable(null);

  const selections = derived(selectedContentStore, ($store) => $store.selections) ; 

  // data operations
  const operations = {
    async loadChapters(examClass, examMedium, examSubject) {
      isLoading.set(true);
      error.set(null);
      try {
        const response = await api.chapterTopics.getAll({
          standard: examClass,
          medium_code: examMedium,
          subject_code: examSubject,
        });
        if (response.error) {
          throw new Error(response.error);
        }
        chaptersData.set(response.data.data);
        console.log('call for loadchapters',response);
        
        return response.data.data;
      } catch (err) {
        error.set(err.message);
        console.error("Error loading chapters", err);
      } finally {
        isLoading.set(false);
      }
    },
    // get selected chapters and topics
    async getSelectedChapterAndTopics() {
      const allSelections = selectedContentStore.getSelections();
      const chapterSelections = allSelections.filter(
        (item) => item.type == "chapter"
      );
      const topicSelections = allSelections.filter((item) => {
        item.type == "topic";
      });

      return {
        getChapters: chapterSelections,
        getTopics: topicSelections,
      };
    },
    // load questions
    async loadQuestions(chapters, topics) {
      error.set(null);
      isLoading.set(true);

      try {
        const apiCalls = [];
        if (chapters && chapters.length > 0) {
          const chapterCodes = chapters.map((c) => c.code).join(",");
          apiCalls.push(
            api.questions.getByGroupCodes({
              type: "chapter",
              codes: chapterCodes,
            })
          );
        }
        if (topics && topics.length > 0) {
          const topicCodes = topics.map((t) => t.code).join(",");

          apiCalls.push(
            api.questions.getByGroupCodes({ type: "topic", codes: topicCodes })
          );
        }
        if (apiCalls.length === 0) {
          return [];
        }
        const responses = await Promise.all(apiCalls);
        console.log('promise all api call',responses);
        
        let allQuestions = [];
        for (const response of responses) {
          if (response.error) throw new Error(response.error);
          if (response.data && response.data.qns) {
            const cleanedQuestions = response.data.qns.map(cleanQuestionText);
            allQuestions = [...allQuestions, ...cleanedQuestions];
          }
        }
        console.log("Load questions", allQuestions);
        return allQuestions;
      } catch (err) {
        error.set(err.message);
        console.error("Error loading questions", err);
        throw err;
      } finally {
        isLoading.set(false);
      }
    },

    async fetchQuestions() {
      const response = operations.getSelectedChapterAndTopics();
      const { getChapters, getTopics } = response;
      const allQuestions = operations.loadQuestions(getChapters, getTopics);

      if (allQuestions && allQuestions.length > 0) {
        const mappedQuestions = allQuestions.map((question) => ({
          id: question.code,
          text: question.text,
          type: question.type,
          marks: question.marks,
          difficulty: question.difficulty_level,
          parent: {
            name: question.grp_type_name,
            type: question.grp_type,
          },
        }));
        fetchedQuestions.set(mappedQuestions) ; 
        selectedContentStore.set(mappedQuestions) ; 
        showQuestions.set(true) ; 
        activeTab.set(true) ; 
        return mappedQuestions ; 
      }
      else { 
        console.log('No questions found for all questions ');
        fetchedQuestions.set([]) ; 
        return [] ;         
      }
    },
    handleQuestionRemoved(questionId,removed,remainingQuestions){
         console.log(`Question ${questionId} ${removed ? "removed" : "restored"}`);
         if(removed) { 
            fetchedQuestions.update(questions => questions.filter(q => q.id !== questionId)) ; 
         }
         selectedContentStore.setQuestions(remainingQuestions || [])  ; 
        
    },
       // UI state management
    toggleChapter(chapterId) {
      expandedChapters.update(expanded => {
        if (expanded.has(chapterId)) {
          expanded.delete(chapterId);
        } else {
          expanded.add(chapterId);
        }
        return new Set(expanded);
      });
    },

    toggleTopic(topicId) {
      expandedTopics.update(expanded => {
        if (expanded.has(topicId)) {
          expanded.delete(topicId);
        } else {
          expanded.add(topicId);
        }
        return new Set(expanded);
      });
    },

    highlightItem(code, type) {
      highlightedItem.set({ code, type });

      // Auto-expand logic
      chaptersData.subscribe(chapters => {
        if (type === "topic") {
          const parentChapter = chapters.find((ch) =>
            ch.topics?.some((t) => t.code === code)
          );
          if (parentChapter) {
            expandedChapters.update(expanded => {
              expanded.add(parentChapter.code);
              return new Set(expanded);
            });
          }
        } else if (type === "subtopic") {
          chapters.forEach((chapter) => {
            chapter.topics?.forEach((topic) => {
              if (topic.subtopics?.some((st) => st.code === code)) {
                expandedChapters.update(expanded => {
                  expanded.add(chapter.code);
                  return new Set(expanded);
                });
                expandedTopics.update(expanded => {
                  expanded.add(topic.code);
                  return new Set(expanded);
                });
              }
            });
          });
        }
      })();

      // Clear highlight after 5 seconds
      setTimeout(() => {
        highlightedItem.set(null);
      }, 5000);
    },

    // Reset UI state
    resetUIState() {
      showQuestions.set(false);
      fetchedQuestions.set([]);
      activeTab.set("questions");
    }
  };

  
  return {
    // State
    isLoading,
    error,
    chaptersData,
    expandedChapters,
    expandedTopics,
    fetchedQuestions,
    showQuestions,
    activeTab,
    highlightedItem,
    selections,
    
    // Operations
    loadChapters: operations.loadChapters,
    fetchQuestions: operations.fetchQuestions,
    handleQuestionRemoved: operations.handleQuestionRemoved,
    toggleChapter: operations.toggleChapter,
    toggleTopic: operations.toggleTopic,
    highlightItem: operations.highlightItem,
    resetUIState: operations.resetUIState,
    getSelectedChaptersAndTopics: operations.getSelectedChaptersAndTopics,
    loadQuestions: operations.loadQuestions
  };
}
