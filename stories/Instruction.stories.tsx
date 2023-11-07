import React from 'react';
import { StoryFn } from '@storybook/react';

import Instruction from '../src/pages/task/instruction';

export default {
  title: 'Tasks/Instruction',
  component: Instruction
};

const InstructionTemplate: StoryFn<typeof Instruction> = (args) => {
  return <Instruction></Instruction>;
};

export const DefaultState = InstructionTemplate.bind({});
