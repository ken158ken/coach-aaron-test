/**
 * 課程卡片元件
 * @module components/CourseCard
 */

import React from "react";
import type { Course } from "@/types";

interface CourseCardProps {
  course: Course;
  className?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = "" }) => {
  return (
    <div
      className={`card w-full bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${className}`}
    >
      <figure className="h-48 overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-2xl font-bold">
          {course.title}
          <div className="badge badge-primary">New</div>
        </h2>
        <p className="text-base-content/70">{course.description}</p>
        <div className="card-actions justify-end items-center mt-4">
          <div className="text-xl font-bold mr-auto text-primary">
            NT$ {course.price}
          </div>
          <button className="btn btn-primary btn-sm">立即購買</button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
