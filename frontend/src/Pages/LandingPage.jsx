// src/pages/LandingPage.jsx

import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
	// Dummy stats for demonstration
	const stats = [
		{ icon: "📅", value: "1,247", label: "Total Requests", color: "from-pink-500 to-purple-500" },
		{ icon: "💚", value: "892", label: "Completed Donations", color: "from-green-400 to-teal-500" },
		{ icon: "👥", value: "3,456", label: "Active Donors", color: "from-blue-500 to-indigo-500" },
		{ icon: "📍", value: "78", label: "Partner Blood Banks", color: "from-purple-500 to-fuchsia-500" },
	];

	const features = [
		{
			icon: "👤",
			title: "Register as Donor",
			desc: "Sign up with your details, blood type, and availability to help save lives in your community with our secure platform.",
			color: "bg-pink-500/20",
		},
		{
			icon: "📅",
			title: "Receive Requests",
			desc: "Get notified when someone needs your blood type and accept or decline requests based on your availability and schedule.",
			color: "bg-blue-500/20",
		},
		{
			icon: "💚",
			title: "Save Lives",
			desc: "Book a convenient time slot, donate blood safely at certified centers, and make a real difference in someone's life.",
			color: "bg-green-500/20",
		},
	];

	return (
		<div className="fixed inset-0 min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#1a1333] via-[#2c1a3a] to-[#2c1a3a] dark:from-slate-900 dark:via-neutral-900 dark:to-black">
			{/* Top Navigation */}
			<header className="relative z-10">
				<nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
							<span className="text-xl">❤️</span>
						</div>
						<span className="text-xl font-bold text-white">Hope Web</span>
					</div>
					<div className="flex gap-3">
						<Link to="/login" className="px-5 py-2 rounded-full bg-gray-800 text-white text-sm font-medium shadow hover:bg-gray-700">Login</Link>
						<Link to="/register" className="px-5 py-2 rounded-full bg-pink-500 text-white text-sm font-medium shadow hover:bg-pink-600">Register</Link>
					</div>
				</nav>
			</header>

			{/* Hero Section */}
			<main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-24 pt-10 md:px-6">
				<section className="w-full flex flex-col items-center">
					<h1 className="text-5xl md:text-6xl font-extrabold text-white text-center mb-2">
						Save Lives Through <span className="text-pink-400">Blood Donation</span>
					</h1>
					<p className="text-lg text-gray-200 text-center mb-8 max-w-2xl">
						Connect blood donors with those in need. Hope Web makes blood donation accessible, efficient, and life-saving for communities worldwide.
					</p>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full max-w-4xl">
						{stats.map((stat, idx) => (
							<div key={idx} className={`rounded-2xl bg-gradient-to-r ${stat.color} p-6 shadow-lg text-center text-white`}>
								<div className="flex justify-center mb-2">
									<span className="text-3xl">{stat.icon}</span>
								</div>
								<div className="text-3xl font-bold mb-1">{stat.value}</div>
								<div className="text-sm opacity-80">{stat.label}</div>
							</div>
						))}
					</div>

					{/* Action Buttons */}
					<div className="flex flex-wrap gap-4 justify-center mb-12">
						<Link to="/donor-register" className="px-6 py-3 rounded-full bg-pink-500 text-white font-semibold shadow hover:bg-pink-600 flex items-center gap-2">
							<span>❤️</span> Become a Donor
						</Link>
						<Link to="/find-blood" className="px-6 py-3 rounded-full bg-gray-800 text-white font-semibold shadow hover:bg-gray-700 flex items-center gap-2">
							<span>👥</span> Find Blood
						</Link>
										<Link to="/bloodbank-login" className="px-6 py-3 rounded-full bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 flex items-center gap-2">
											<span>🏥</span> Blood Bank Login
										</Link>
					</div>
				</section>

				{/* How Hope Web Works Section */}
				<section className="w-full flex flex-col items-center mt-8">
					<h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-2">How Hope Web Works</h2>
					<p className="text-md text-gray-200 text-center mb-8 max-w-2xl">
						Join thousands of heroes making a difference through our streamlined donation process
					</p>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
						{features.map((feature, idx) => (
							<div key={idx} className={`rounded-2xl ${feature.color} p-8 shadow-lg text-center text-white`}>
								<div className="flex justify-center mb-4">
									<span className="text-4xl">{feature.icon}</span>
								</div>
								<div className="text-xl font-bold mb-2">{feature.title}</div>
								<div className="text-sm opacity-80">{feature.desc}</div>
							</div>
						))}
					</div>
				</section>
			</main>
			{/* Footer Section */}
			<footer className="w-full bg-transparent py-12 flex flex-col items-center">
				<div className="flex flex-col items-center">
					<div className="flex items-center gap-3 mb-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
							<span className="text-xl">❤️</span>
						</div>
						<span className="text-2xl font-bold text-white">Hope Web</span>
					</div>
					<p className="text-md text-gray-200 text-center mb-4 max-w-xl">
						Connecting hearts, saving lives. Join our community of heroes making a difference through blood donation.
					</p>
					<div className="flex gap-8 justify-center mt-2 text-pink-300 text-sm">
						<div className="flex items-center gap-2"><span>🔒</span> Secure &amp; Safe</div>
						<div className="flex items-center gap-2"><span>🕑</span> 24/7 Support</div>
						<div className="flex items-center gap-2"><span>💖</span> Lives Saved Daily</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
