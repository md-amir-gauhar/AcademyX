"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TestAnswer, TestOption, TestQuestion } from "@/types/test";
import { SolutionItem } from "./solution-item";

interface Section {
  id: string;
  name: string;
  questions: TestQuestion[];
}

interface ReportQuestionListProps {
  sections: Section[];
  answers: Array<TestAnswer & { question?: TestQuestion; selectedOption?: TestOption | null }>;
}

export function ReportQuestionList({ sections, answers }: ReportQuestionListProps) {
  return (
    <>
      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-lg">{section.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.questions.map((question, qIdx) => {
              const answer = answers.find((a) => a.questionId === question.id);
              return (
                <SolutionItem
                  key={question.id}
                  question={question}
                  answer={answer}
                  index={qIdx}
                />
              );
            })}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
