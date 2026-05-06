mod app;
mod util;

#[cfg(not(mobile))]
use tauri::Manager;
#[cfg(not(mobile))]
use tauri_plugin_window_state::Builder as WindowStatePlugin;
#[cfg(not(mobile))]
use tauri_plugin_window_state::StateFlags;

#[cfg(target_os = "macos")]
use std::time::Duration;

#[cfg(not(mobile))]
const WINDOW_SHOW_DELAY: u64 = 50;

#[cfg(not(mobile))]
use app::{
    invoke::{
        clear_cache_and_restart, download_file, download_file_by_binary, send_notification,
        update_theme_mode,
    },
    setup::{set_global_shortcut, set_system_tray},
    window::{open_additional_window_safe, set_window, MultiWindowState},
};

#[cfg(mobile)]
use app::invoke::{
    clear_cache_and_restart, download_file, download_file_by_binary, send_notification,
    update_theme_mode,
};

use util::get_pake_config;

#[cfg(not(mobile))]
pub fn run_app() {
    #[cfg(target_os = "linux")]
    {
        let safe_mode = std::env::var("PAKE_LINUX_WEBKIT_SAFE_MODE")
            .map(|value| value == "1")
            .unwrap_or(false);

        if safe_mode {
            if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            }
            if std::env::var("WEBKIT_DISABLE_COMPOSITING_MODE").is_err() {
                std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
            }
        }
    }

    let (pake_config, tauri_config) = get_pake_config();
    let tauri_app = tauri::Builder::default();

    let show_system_tray = pake_config.show_system_tray();
    let hide_on_close = pake_config.windows[0].hide_on_close;
    let activation_shortcut = pake_config.windows[0].activation_shortcut.clone();
    let init_fullscreen = pake_config.windows[0].fullscreen;
    let start_to_tray = pake_config.windows[0].start_to_tray && show_system_tray;
    let multi_instance = pake_config.multi_instance;
    let multi_window = pake_config.multi_window;

    let window_state_plugin = WindowStatePlugin::default()
        .with_state_flags(if init_fullscreen {
            StateFlags::FULLSCREEN
        } else {
            #[cfg(target_os = "linux")]
            {
                StateFlags::all()
            }
            #[cfg(not(target_os = "linux"))]
            {
                StateFlags::all() & !StateFlags::VISIBLE
            }
        })
        .build();

    #[allow(deprecated)]
    let mut app_builder = tauri_app
        .plugin(window_state_plugin)
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init());

    if !multi_instance {
        app_builder = app_builder.plugin(tauri_plugin_single_instance::init(
            move |app, _args, _cwd| {
                if multi_window {
                    open_additional_window_safe(app);
                } else if let Some(window) = app.get_webview_window("pake") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            },
        ));
    }

    app_builder
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_file_by_binary,
            send_notification,
            update_theme_mode,
            clear_cache_and_restart,
        ])
        .setup(move |app| {
            app.manage(MultiWindowState::new(
                pake_config.clone(),
                tauri_config.clone(),
            ));

            #[cfg(target_os = "macos")]
            {
                let menu = app::menu::get_menu(app.app_handle(), multi_window)?;
                app.set_menu(menu)?;
                app.on_menu_event(move |app_handle, event| {
                    app::menu::handle_menu_click(app_handle, event.id().as_ref());
                });
            }

            let window = set_window(app.app_handle(), &pake_config, &tauri_config);
            set_system_tray(
                app.app_handle(),
                show_system_tray,
                &pake_config.system_tray_path,
                init_fullscreen,
                multi_window,
            )?;
            set_global_shortcut(app.app_handle(), activation_shortcut, init_fullscreen)?;

            if !start_to_tray {
                let window_clone = window.clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_millis(WINDOW_SHOW_DELAY)).await;
                    let _ = window_clone.show();

                    #[cfg(target_os = "linux")]
                    {
                        if init_fullscreen {
                            let _ = window_clone.set_fullscreen(true);
                            let _ = window_clone.set_focus();
                        } else {
                            tokio::time::sleep(tokio::time::Duration::from_millis(30)).await;
                            let _ = window_clone.set_focus();
                        }
                    }
                });
            }

            Ok(())
        })
        .on_window_event(move |_window, _event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = _event {
                if hide_on_close && _window.label() == "pake" {
                    let window = _window.clone();
                    tauri::async_runtime::spawn(async move {
                        #[cfg(target_os = "macos")]
                        {
                            if window.is_fullscreen().unwrap_or(false) {
                                let _ = window.set_fullscreen(false);
                                tokio::time::sleep(Duration::from_millis(900)).await;
                            }
                        }
                        #[cfg(target_os = "linux")]
                        {
                            if window.is_fullscreen().unwrap_or(false) {
                                let _ = window.set_fullscreen(false);
                                let _ = window.set_focus();
                            }
                        }
                        #[cfg(not(target_os = "macos"))]
                        let _ = window.minimize();
                        let _ = window.hide();
                    });
                    api.prevent_close();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen {
                has_visible_windows,
                ..
            } = _event
            {
                if !has_visible_windows {
                    if let Some(window) = _app.get_webview_window("pake") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        });
}

#[cfg(mobile)]
pub fn run_app() {
    let (_pake_config, _tauri_config) = get_pake_config();

    #[allow(deprecated)]
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            download_file,
            download_file_by_binary,
            send_notification,
            update_theme_mode,
            clear_cache_and_restart,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {});
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    run_app()
}
