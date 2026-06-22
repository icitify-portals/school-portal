
{{-- ADD-MODAL-SECTION-POPUP-MODAL --}}
<!-- modal_popup -->
<div class=" modal modal-lg fade" id="editore_modal_overlay_lesson" tabindex="-1" aria-labelledby="Editor_modal_lessons" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <div class="d-flex justify-content-between" style="width: 100%">
                    <h1 class="modal-title fs-5 text-bold text-primary" id="Editor_modal">
                        Add {{$isExam ? "Modules" : "Lessons"}}</h1>
                    <div class="d-flex gap-3">
                        <button type="button" class="btn btn-success" id="all_lesson_done">Done</button>
                        <button type="button" class="btn btn-danger" id="close_modal_lesson">Close</button>
                    </div>

                </div>

            </div>

            <div class="modal-body">
                <div class="container" id="editor_container">
                    <!-- Editor Container -->
                    <div class="lessonname pt-1 pb-2">
                        <input class="form-control" id="lesson_name" type="text" placeholder="Input Lesson Name" aria-label="input lesson name" />
                    </div>
                    {{-- <div class="pb-1">
                        <input class="form-control" id="lesson_description" type="text" placeholder="Input Lesson Description" aria-label="input lesson Desc" />
                    </div> --}}
                    <div class="title_edit_lesson"> <small class="form-text text-muted">Leave lesson video ,attachment and video url empty if no changes is required</small></div>
                    <div id="editor-container">
                        <!-- Toolbar -->
                        <div id="editor-toolbar">
                            <button type="button" id="bold-btn" title="Bold"><i class="fas fa-bold"></i></button>
                            <button type="button" id="italic-btn" title="Italic"><i class="fas fa-italic"></i></button>
                            <button type="button" id="underline-btn" title="Underline"><i class="fas fa-underline"></i></button>
                            <button type="button" id="h1-btn" title="Heading 1"><i class="fas fa-heading"></i>
                                1</button>
                            <button type="button" id="h2-btn" title="Heading 2"><i class="fas fa-heading"></i>
                                2</button>
                            <button type="button" id="ul-btn" title="Unordered List"><i class="fas fa-list-ul"></i></button>
                            <button type="button" id="ol-btn" title="Ordered List"><i class="fas fa-list-ol"></i></button>
                            {{-- <button type="button" id="blockquote-btn" title="Blockquote"><i class="fas fa-quote-right"></i></button> --}}
                            {{-- <button type="button" id="link-btn" title="Insert Link"><i class="fas fa-link"></i></button> --}}
                            <button type="button" id="reset_content" title="Clear all">
                                <i class="fa fa-times"></i>
                            </button>
                            <button type="button" id="undo-btn" title="Undo"><i class="fas fa-undo"></i></button>
                            <button type="button" id="redo-btn" title="Redo"><i class="fas fa-redo"></i></button>
                            <input type="color" id="text-color-picker" title="Text Color">
                            <input type="color" id="bg-color-picker" title="Background Color">

                            <!-- Icons for Image and Video Uploads -->
                            <button type="button" id="blockquote-btn" title="upload file"><i class="fas fa-file"></i></button>
                            <button type="button" id="image-icon" title="Insert Image"><i class="fas fa-image"></i></button>
                            <button type="button" id="video-icon" title="Insert Video"><i class="fas fa-video"></i></button>
                            <button type="button" id="video-url-btn" title="Embed Youtube URL"><i class="fas fa-link"></i></button>
                            <button type="button" id="audio-icon" title="Insert Audio">
                                <i class="fa-solid fa-music"></i></button>

                            <!-- Hidden file inputs -->
                            <input type="file" id="image-upload" accept="image/*" style="display: none;">
                            <input type="file" id="video-upload" accept="video/*" style="display: none;">
                            <input type="file" id="audio-upload" accept="audio/*" style="display: none;">
                            <input type="file" name="" id="file-upload" style="display: none">
                            <button type="button" id="table-btn" title="Insert Table"><i class="fas fa-table"></i></button>
                        </div>

                        <!-- Editable Area -->
                        <div id="custom-editor" contenteditable="true" aria-details="content_placeholder">

                        </div>
                    </div>
                    <!-- </form> -->
                </div>
            </div>
        </div>
    </div>
</div>

