import React from 'react';
import { StoryFn } from '@storybook/react';

import Information from '../src/pages/task/information';
import { InformationTask } from '../src/typings/Task';
import { TaskType } from '../src/typings/TaskType.enum';
import { ThemeStyle } from '../src/typings/ThemeStyle.enum';

const task: InformationTask = {
  ok: true,
  theme: ThemeStyle.Light,
  required: true,
  id: 1,
  type: TaskType.Information,
  image_url:
    'https://media2.giphy.com/media/l41lPZpU2FncYBeH6/giphy.gif?cid=ecf05e47cxwmbshoe7m5z1eocmxzu8htrv7o7fsu3r260vzb&ep=v1_gifs_search&rid=giphy.gif&ct=g',
  content: `# The Tapestry of Life

Once upon a time, in a world not unlike our own, there was a small village nestled between the rolling hills and deep forests. The villagers lived in harmony with nature, understanding the delicate balance between giving and taking from the earth. Their lives were simple, yet rich with the kind of wisdom that only comes from being deeply connected to the natural world.

## The Harmony of Nature

In this village, the people understood the language of the trees and the whispers of the wind. They knew when to plant their crops by watching the stars and could predict the weather by observing the behavior of birds. This deep connection to nature wasn't just a part of their survival; it was a part of their very essence.

**Pros:**
- Deep understanding of the environment.
- Sustainable living practices.
- Strong community bonds.

**Cons:**
- Vulnerability to natural disasters.
- Limited access to modern technology.
- Potential isolation from the broader world.

## The Art of Storytelling

Storytelling was the heart of the village's culture. Elders would gather the children under the ancient oak tree and tell tales of the stars, the sea, and the forest. These stories were not just entertainment; they were the threads that wove the community together, passing down knowledge and values from one generation to the next.

**Pros:**
- Preservation of culture and history.
- Educational and moral lessons for younger generations.
- Fostering a sense of community and belonging.

**Cons:**
- Possible loss of relevance in a rapidly changing world.
- Risk of misinterpretation or alteration over time.
- Limited exposure to diverse perspectives.

## The Challenge of Change

As the world outside began to change, with new technologies and ways of life emerging, the village faced a crossroads. Some villagers were curious and excited about these new possibilities, while others feared that their way of life might be lost forever.

**Pros:**
- Opportunity for growth and development.
- Access to new technologies and medical advancements.
- Potential for increased communication and trade with the outside world.

**Cons:**
- Risk of losing cultural identity.
- Potential environmental degradation.
- Social disruption and conflict.

## The Wisdom of Balance

The village elders called a meeting under the full moon. They spoke of the importance of balance – not just with nature, but within their community and with the outside world. They proposed a path forward that would embrace the new while honoring the old.

**Pros:**
- Harmonious integration of old and new ways.
- Sustainable development.
- Preservation of cultural identity while embracing change.

**Cons:**
- Challenges in finding the right balance.
- Possible resistance from different segments of the community.
- The complexity of implementing a balanced approach.

## The Journey Ahead

As the village embarked on this journey, they discovered that the world was much larger and more diverse than they had ever imagined. They learned from others, shared their wisdom, and found that, in the grand tapestry of life, every thread is essential.

**Pros:**
- Broader understanding and appreciation of the world.
- New opportunities for collaboration and learning.
- Strengthening of community resilience and adaptability.

**Cons:**
- Overwhelming exposure to new ideas and practices.
- Risk of cultural dilution.
- Challenges in maintaining core values amidst change.

## Conclusion: Embracing the Tapestry

In the end, the village found a way to weave the new threads into their tapestry without losing the essence of their heritage. They showed that it is possible to grow and evolve while staying true to one's roots. And so, the village continued to thrive, a beautiful blend of the old and the new, a testament to the enduring power of balance and harmony.
`
};

export default {
  title: 'Tasks/Information',
  component: Information
};

const InfoTemplateLight: StoryFn<typeof Information> = (args) => {
  document.documentElement.classList.remove('dark');
  return <Information testTask={task}></Information>;
};

const InfoTemplateDark: StoryFn<typeof Information> = (args) => {
  document.documentElement.classList.add('dark');
  return <Information testTask={task}></Information>;
};

export const LightState = InfoTemplateLight.bind({});
export const DarkState = InfoTemplateDark.bind({});
