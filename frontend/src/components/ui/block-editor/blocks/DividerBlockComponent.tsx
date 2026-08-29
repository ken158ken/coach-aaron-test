/**
 * 分隔線區塊元件
 * @module components/ui/block-editor/blocks/DividerBlockComponent
 */

import React from "react";
import type { DividerBlock } from "../types";

interface DividerBlockComponentProps {
  block: DividerBlock;
}

const DividerBlockComponent: React.FC<DividerBlockComponentProps> = ({
  block,
}) => {
  return (
    <div className="w-full h-full flex items-center">
      <hr
        className="w-full"
        style={{
          border: "none",
          borderTop: `${block.thickness}px ${block.style} ${block.color}`,
        }}
      />
    </div>
  );
};

export default DividerBlockComponent;
