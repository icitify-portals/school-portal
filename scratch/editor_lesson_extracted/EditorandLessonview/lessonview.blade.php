@extends('layouts.lecturerapp')
@section('content')
{{-- @include('partials.lecturerheader') --}}
@vite(['resources/css/create-assessment/assessment.css','resources/sass/app.scss','resources/lecturers/main.scss','resources/js/courseview/lessonview.js','resources/js/livewire/livewire.js'])
<section class="lessonview_layout">
    <div class="video_area">
        {{-- lecture-toolsandall --}}
        <div class="lecture_cta">
            <div class="d-flex justify-content-between align-items-center gap-2">
                <div class="d-flex justify-content-center align-items-center gap-3">
                    <div class="wrapper_unvisible" id="backbtn">
                        <i class="fa-solid fa-angle-left" style="font-size: 1.2rem;color: rgba(12, 50, 148, 0.933)"></i>
                        <div style="display: none;" id="is_n_role">{{auth()->user()->role}}</div>
                    </div>
                    <h5 class="lesson_name">{{'Lesson ' . $lesson->lesson_number . ':  '.$lesson->name}}</h5>
                </div>
                <div id="action_btn_lesson" class="d-flex justify-content-center align-items-center gap-4 action_btn_lesson" id="btn_view">
                    @if ($hasassessment)
                    <button type="button" class="btn btn-success btn-md shadow-lg add_assessment_btn" id="add_assessment_btn">Take Assessment</button>
                    @endif
                </div>

                {{-- is_stu_assess --}}

                @if ($hasassessment)
                <div class="more_mobile_isstu is_stu_assess">
                    <button type="button" class="btn btn-success btn-md shadow-lg add_assessment_btn" id="add_assessment_btn">Take Test</button>
                </div>
                @endif
                {{-- @if ($hasassessment)
                <div id="more_mobile_lesson" class="more_mobile_lesson" data-bs-toggle="dropdown">
                    <div class="wrapper_unvisible" style="border: 2px solid #0808dc;font-size:1.2rem;"><i class="fa-solid fa-angle-down caret_down"></i></div>
                </div>

                
                {{-- drop-down-button --}}
                {{-- <div class="dropdown-menu" aria-labelledby="more_mobile_lesson" id="actual_p_dropdown">
                    <li>
                        <div class="dropdown-item" id="add_assessment_btn" style="cursor: pointer">Take Assessment</div>
                    </li>
                </div> --}}
                {{-- @endif  --}}
            </div>

        </div>
        {{-- media-video-containers --}}
       <div class="media_lesson_interface" style="height: {{(empty($lesson->video) && empty($lesson->video_url)) ? "0vh" : "70vh"}}" >
            {{-- live-class-layout --}}
            <div id="video_class_layout">
                <div class="meet_live">
                    <div id="remote-video"></div>
                </div>
                <div id="local-video"></div>
                <div class="controls_section">
                    {{-- mic-controls --}}

                    {{-- toggle-video --}}
                    <div id="togglevideo" class="control_container_vid">
                        <i class="fa-solid fa-video icon_styles_con"></i>
                    </div>
                    {{-- togglemicrophone --}}
                    <div id="toggleaudio" class="control_container_vid">
                        <i class="fa-solid fa-microphone icon_styles_con"></i>
                    </div>
                    {{-- end-call --}}
                    <div class="control_container_vid" id="end_call">
                        <i class="fa-solid fa-phone icon_styles_con canccall"></i>
                    </div>
                </div>
            </div>
            {{-- video-lesson-show --}}
           <div id="media_uploaded" style="height: {{!$lesson->video ? "0vh" : "70vh"}}">
                @if($lesson->video)
                <video controls>
                    <source src="{{$lesson->video}}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                @else
                @if($lesson->video_url)
                <div data-attribute={{$lesson->video_url}} id="video_utube_cnt">

                </div>
                @else
                <h5 class="text-center" id="lessvidpresent" style="display:none">
                    No Video For this Lesson
                </h5>
                @endif
                @endif
            </div>
        </div>
        {{-- media-attachments --}}
        <section class="pt-2">
            <div class="lesson_desc pt-2">
                <div>{!! $lesson->description !!}</div>
            </div>
            <h5 class="lesson_name">Lesson Attachments</h5>
            {{-- flex-box-of-video-/audio/anyattchments --}}
       
                @if(isset($lesson->image) || isset($lesson->audio) || isset($lesson->attachment))
            <div class="pt-3" id="lesson_attachments">
                @if($lesson->image)
                 {{-- stale -feature due to accessibility issue  --}}
                {{-- <div class="lesson-image-container" style="cursor: pointer; max-height: 300px; overflow: hidden; border-radius: 0.5rem; box-shadow: 0 8px 16px rgba(0,0,0,0.2); position: relative;" title="Click to view full image">
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 4px;" data-bs-toggle="modal" data-bs-target="#imageModal">
                        <i class="fa-solid fa-expand"></i> Click to expand
                    </div>
                    <img src="{{$lesson->image}}" alt="Lesson Image" class="lesson-thumbnail" 
                         style="width: 100%; height: 100%; object-fit: cover;" 
                         data-bs-toggle="modal" data-bs-target="#imageModal">
                </div> --}}

                <!-- Image Modal -->
                {{-- <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="imageModalLabel">Lesson Image</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-0">
                                <img src="{{$lesson->image}}" alt="Lesson Image" style="width: 100%; max-height: 85vh; object-fit: contain;">
                            </div>
                        </div>
                    </div>
                </div> --}}
                <img src="{{$lesson->image}}" alt="Lesson Image" class="" style="object-fit: cover; border-radius: 0.4rem;width:100%;height: 100%">
                @endif
                @if($lesson->audio)
                <audio controls class="w-100" style="height: 50px" src="{{$lesson->audio}}">
                </audio>
                @endif
                @if($lesson->attachment)
                @php $extension = pathinfo($lesson->attachment, PATHINFO_EXTENSION); @endphp

                @if($extension === 'pdf')
                <iframe src="{{ asset($lesson->attachment) }}" width="100%" height="600px"></iframe>

                @elseif($extension === 'txt')
                <pre>{{ file_get_contents($lesson->attachment) }}</pre>

                @elseif($extension === 'docx')
                <iframe src="https://docs.google.com/gview?url={{ $lesson->attachment }}&embedded=true" width="100%" height="600px"></iframe>

                @elseif($extension === 'md')
                <div class="markdown-content">
                    {!! $lesson->description !!}
                </div>
                @endif

                <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                    <a target="_blank" href="{{ $lesson->attachment }}" download class="btn btn-primary">
                        Download Attachment
                    </a>
                </div>
                @endif
            </div>
            @else
            <h6 class="text-center pt-4">📎 Currently, there are no attachments available for this lesson</h6>
            @endif
        </section>
    </div>

    <div class="chat_section">
        <div class="lecture_cta">
            <div class="d-flex justify-content-between align-items-center" id="parent_stu_pr_eve_del">
               <div class="d-flex align-items-center justify-content-start gap-2">
                    <h5 class="lesson_name">Classroom</h5>
                    <div class="classroom-lock" title="Chat Lock" style="cursor: pointer; display: flex; align-items: center;">
                        <span class="locked-icon" style="font-size: 1.6rem; color: #0c3294;display:none">🔒</span>
                        <span class="unlocked-icon" style="font-size: 1.6rem; color: #0c3294; display: block;">🔓</span>
                    </div>
                </div>
                @if($course->course_type === 'special')
                <div id="joincall_wrapper">
                    {{-- id="StartCall" --}}
                    <button class="btn btn-primary btn-md btn-primary-color shadow-lg live_btn_stu_premium" id="joincallstudent">
                        <i class="fa-solid fa-podcast"></i>
                        Join live call
                    </button>
                </div>
                @endif
            </div>
        </div>
        {{-- chat_container --}}
        <div class="live_chat">
            <input type="hidden" id="curruserid" value="{{ auth()->user()->id }}">
            <div class="" id="chat-box" style="height: 90%; overflow-y: auto; overflow-x:hidden; padding: 15px;width:100%;">

                <div class="fetchingmessageload">
                    <h5 class="loading-text">Loading Chats <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></h5>
                </div>
                <!-- Chat messages will be displayed here -->
            </div>
            {{-- send-message-areas --}}
            <div style="padding-inline:1rem;">
                <div class="input-group">
                    <div class="form_datas"><input type="text" id="chat-input" class="form-control" placeholder="Type a message..." />
                        <div class="d-flex gap-0">
                            <button class="btn btn-primay no_styling_btn" id="insert_image_call">
                                <i class="fa-solid fa-camera"></i>
                            </button>
                            <button class="btn btn-primay no_styling_btn" id="audio_btn_record">
                                <i class="fa-solid fa-microphone"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-primary" id="send-message"><i class="fa fa-paper-plane send-paper" aria-hidden="true"></i></button>
                    {{-- audio-signal-flow --}}
                    <div class="audio-signal">
                        <input type="hidden" id="audio_data" name="audio_data" />
                        <h4 id="record_text">Recording Message</h4>
                        <div class="img_record_wrapper" id="record_wave">
                            <img src="{{asset ('images/Recording.gif') }}" alt="audio-wave" style="width: 85px; height: 85px">
                        </div>

                        {{-- last_flex_action_btn --}}
                        <div class="d-flex justify-content-between" style="width: 70%; ">

                            <button class="btn btn-primay no_styling_btn record_btns" id="cancel_record">
                                <i class="fas fa-times" style="color: #ffff"></i>
                            </button>
                            <button class="btn btn-primay no_styling_btn record_btns" id="stop_record">

                                <i class="fas fa-stop b" style="color:red"></i>
                            </button>
                            <button class="btn btn-primay no_styling_btn record_btns" id="send_audio_record">
                                <i class="fa fa-paper-plane" aria-hidden="true" style="color: #ffff !important"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</section>


{{--lesson view loader- --}}
<div id="loadingAnimationLesson" class="pre_loading_frame">
    <h2>Loading Classroom...</h2>
    <div class="h6" style="text-align: center">⏳ Hang tight! Your lesson is being prepared.</div>
    <div class="spinnerr"></div>
</div>

{{-- loader- --}}
<div id="loadingAnimation" class="loading-frame">
    <h2>Streaming in progress..</h2>
    <div class="h6">Hang on! Your live class is about to begin.</div>
    <div>
        <img src=" {{asset ('images/Loader.gif') }}" alt="stream-loading" style="width: 110px; height: 110px;">
    </div>
</div>

{{-- modal-add-image --}}
<div class="modal fade modal-md" id="insertimageModal" tabindex="-1" aria-labelledby="imageform" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5 text-bold text-primary" id="walletform">Upload Image</h1>
                <button type="button" class="btn-close text-danger" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="insert_button_layout">
                    <label for="upload_buttonsend_image" class="file_image btn btn-success">
                        Upload Image
                    </label>
                    <input type="file" id="upload_buttonsend_image" style="display: none" accept="image/*">
                    <h6>
                        10MB Max
                    </h6>
                </div>
                <div id="image_display_conta" class="pt-2">

                </div>
                <div class="text-area-message pt-2">
                    <textarea id="image_text_sent" rows="3" placeholder="Type Message..." class="form-control" style="height: 138px;resize:none"></textarea>
                </div>
                <div class="pt-2">
                    <button class="btn btn-primary" id="clicker_send_image" style="width: 100%"> <i class="fa fa-paper-plane" aria-hidden="true" style="margin-right: 10px"></i>Send</button>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
