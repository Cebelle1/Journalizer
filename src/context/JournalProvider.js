import React, { createContext, useState } from 'react';

export const JournalContext = createContext();

export const JournalProvider = ({ children }) => {
    const [entries, setEntries] = useState([]);

    const addEntry = (entry) => {
        setEntries([...entries, entry]);
    };

    const removeEntry = (id) => {
        setEntries(entries.filter(entry => entry.id !== id));
    };

    return (
        <JournalContext.Provider value={{ entries, addEntry, removeEntry }}>
            {children}
        </JournalContext.Provider>
    );
};