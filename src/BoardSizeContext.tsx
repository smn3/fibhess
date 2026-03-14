import { createContext, useContext } from 'react';

export const BoardSizeContext = createContext<number>(50);

export const useCellSize = () => useContext(BoardSizeContext);
