#pragma once

// These will improve the readability of the connection definition

#define getT(Idx) template get<Idx>()
#define connectT(Idx, target) template connect<Idx>(target)
#define getParameterT(Idx) template getParameter<Idx>()
#define setParameterT(Idx, value) template setParameter<Idx>(value)
#define setParameterWT(Idx, value) template setWrapParameter<Idx>(value)
using namespace scriptnode;
using namespace snex;
using namespace snex::Types;

namespace InterSamplePeakBlocker_impl
{
// ==============================| Node & Parameter type declarations |==============================

template <int NV>
using InterSamplePeakBlocker_t_ = container::chain<parameter::empty, 
                                                   wrap::fix<2, core::gain<NV>>>;

// =================================| Root node initialiser class |=================================

template <int NV> struct instance: public InterSamplePeakBlocker_impl::InterSamplePeakBlocker_t_<NV>
{
	
	struct metadata
	{
		static const int NumTables = 0;
		static const int NumSliderPacks = 0;
		static const int NumAudioFiles = 0;
		static const int NumFilters = 0;
		static const int NumDisplayBuffers = 0;
		
		SNEX_METADATA_ID(InterSamplePeakBlocker);
		SNEX_METADATA_NUM_CHANNELS(2);
		SNEX_METADATA_ENCODED_PARAMETERS(2)
		{
			0x0000, 0x0000
		};
		SNEX_METADATA_ENCODED_MOD_INFO(2)
		{
			0x3D3B, 0x003E
		};
	};
	
	instance()
	{
		// Node References -------------------------------------------------------------------------
		
		auto& gain = this->getT(0); // core::gain<NV>
		
		// Default Values --------------------------------------------------------------------------
		
		gain.setParameterT(0, -0.999999); // core::gain::Gain
		gain.setParameterT(1, 20.);       // core::gain::Smoothing
		gain.setParameterT(2, 0.);        // core::gain::ResetValue
		
	}
	
	static constexpr bool isPolyphonic() { return NV > 1; };
	
	static constexpr bool hasTail() { return true; };
	
	static constexpr bool isSuspendedOnSilence() { return false; };
};
}

#undef getT
#undef connectT
#undef setParameterT
#undef setParameterWT
#undef getParameterT
// ======================================| Public Definition |======================================

namespace project
{
// polyphonic template declaration

template <int NV>
using InterSamplePeakBlocker = wrap::node<InterSamplePeakBlocker_impl::instance<NV>>;
}


