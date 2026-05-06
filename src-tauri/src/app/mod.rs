pub mod config;
pub mod invoke;
#[cfg(all(not(mobile), target_os = "macos"))]
pub mod menu;
#[cfg(not(mobile))]
pub mod setup;
#[cfg(not(mobile))]
pub mod window;
