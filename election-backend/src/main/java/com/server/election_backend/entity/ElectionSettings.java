package com.server.election_backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "settings")
public class ElectionSettings {
    @Id
    private String id = "global_settings";
    private boolean isOpen;

    public ElectionSettings() {}
    public ElectionSettings(boolean isOpen) { this.isOpen = isOpen; }

    public boolean isOpen() { return isOpen; }
    public void setOpen(boolean open) { isOpen = open; }
}