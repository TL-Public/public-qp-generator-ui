import { selectedContentStore } from '$lib/stores/selectedContentStore.js';

export function createSelectionLogic(chaptersData) {
  return {
    // Handle checkbox changes
    handleCheckboxChange(event, item, type, chapters) {
      event.stopPropagation();
      const isChecked = event.target.checked;

      // Find complete parent information with context
      let contextData = null;
      if (type === "topic") {
        const parentChapter = chapters.find(
          (ch) => ch.topics && ch.topics.some((t) => t.code === item.code)
        );

        if (parentChapter) {
          contextData = {
            parentChapter: {
              code: parentChapter.code,
              name: parentChapter.name,
              question_count: parentChapter.question_count,
            },
          };
          selectedContentStore.storeChapterMetadata(parentChapter);
        }
      } else if (type === "subtopic") {
        let parentChapter = null;
        let parentTopic = null;

        chapters.forEach((chapter) => {
          if (chapter.topics) {
            chapter.topics.forEach((topic) => {
              if (
                topic.subtopics &&
                topic.subtopics.some((st) => st.code === item.code)
              ) {
                parentChapter = chapter;
                parentTopic = topic;
              }
            });
          }
        });

        if (parentChapter && parentTopic) {
          contextData = {
            parentChapter: {
              code: parentChapter.code,
              name: parentChapter.name,
              question_count: parentChapter.question_count,
            },
            parentTopic: {
              code: parentTopic.code,
              name: parentTopic.name,
              question_count: parentTopic.question_count,
            },
          };
          selectedContentStore.storeChapterMetadata(parentChapter);
        }
      }

      const selectionData = {
        code: item.code,
        name: item.name,
        question_count: item.question_count || 0,
        type: type,
        parent_code: contextData
          ? type === "topic"
            ? contextData.parentChapter.code
            : contextData.parentTopic.code
          : null,
      };

      if (isChecked) {
        // Handle cleanup logic
        if (type === "chapter") {
          const chapter = chapters.find((ch) => ch.code === item.code);
          if (chapter && chapter.topics) {
            chapter.topics.forEach((topic) => {
              selectedContentStore.removeSelection(topic.code);
              if (topic.subtopics) {
                topic.subtopics.forEach((subtopic) => {
                  selectedContentStore.removeSelection(subtopic.code);
                });
              }
            });
          }
        }

        if (type === "topic") {
          const parentChapter = chapters.find((ch) =>
            ch.topics?.some((t) => t.code === item.code)
          );
          if (parentChapter) {
            const topic = parentChapter.topics.find((t) => t.code === item.code);
            if (topic && topic.subtopics) {
              topic.subtopics.forEach((subtopic) => {
                selectedContentStore.removeSelection(subtopic.code);
              });
            }
          }
        }

        selectedContentStore.addSelectionWithContext(selectionData, contextData);
      } else {
        selectedContentStore.removeSelection(item.code);
      }

      return { item: selectionData, type };
    },

    // Helper functions
    isChapterSelected(chapterCode) {
      return selectedContentStore.isSelected(chapterCode, "chapter");
    },

    isTopicLogicallySelected(topicCode, chapterCode) {
      return selectedContentStore.isLogicallySelected(topicCode, "topic");
    },

    isSubtopicLogicallySelected(subtopicCode, topicCode, chapterCode) {
      return selectedContentStore.isLogicallySelected(subtopicCode, "subtopic");
    },

    getSelectedItemsForChapter(chapter, selections) {
      const allTopics = chapter.topics || [];
      const allSubtopics = allTopics.flatMap((t) => t.subtopics || []);
      const selectedCodesInStore = new Set(selections.map((s) => s.code));

      const selectedTopics = allTopics.filter((t) =>
        selectedCodesInStore.has(t.code)
      );
      const selectedSubtopics = allSubtopics.filter((st) =>
        selectedCodesInStore.has(st.code)
      );

      return [...selectedTopics, ...selectedSubtopics];
    }
  };
}